create table if not exists public.patient_invitations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  patient_user_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(doctor_id, patient_user_id)
);

alter table public.patient_invitations enable row level security;

create policy "Doctors can insert their own invitations"
  on public.patient_invitations for insert
  with check (auth.uid() = doctor_id);

create policy "Users can read their invitations"
  on public.patient_invitations for select
  using (auth.uid() = doctor_id or auth.uid() = patient_user_id);

create policy "Patients can update invitation status"
  on public.patient_invitations for update
  using (auth.uid() = patient_user_id);

create trigger update_patient_invitations_updated_at
  before update on public.patient_invitations
  for each row execute function public.update_updated_at_column();

-- Trigger: when invitation accepted, create doctor_patients link + notification
create or replace function public.handle_invitation_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'accepted' and OLD.status <> 'accepted' then
    insert into public.doctor_patients (doctor_id, patient_id)
    values (NEW.doctor_id, NEW.patient_user_id)
    on conflict do nothing;

    insert into public.notifications (user_id, title, message, type)
    values (NEW.doctor_id, 'Taklif qabul qilindi', 'Foydalanuvchi sizning bemoringiz sifatida qo''shildi', 'success');
  elsif NEW.status = 'declined' and OLD.status <> 'declined' then
    insert into public.notifications (user_id, title, message, type)
    values (NEW.doctor_id, 'Taklif rad etildi', 'Foydalanuvchi taklifni rad etdi', 'warning');
  end if;
  return NEW;
end;
$$;

create trigger on_invitation_status_change
  after update on public.patient_invitations
  for each row execute function public.handle_invitation_accept();

-- Notify patient when invitation is created
create or replace function public.notify_new_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _doctor_name text;
begin
  select full_name into _doctor_name from public.profiles where user_id = NEW.doctor_id;
  insert into public.notifications (user_id, title, message, type, link)
  values (
    NEW.patient_user_id,
    'Yangi shifokor taklifi',
    coalesce(_doctor_name, 'Shifokor') || ' sizni o''z bemorlari ro''yxatiga qo''shmoqchi',
    'info',
    'chat'
  );
  return NEW;
end;
$$;

create trigger on_new_invitation
  after insert on public.patient_invitations
  for each row execute function public.notify_new_invitation();