-- patient_invitations: tracks when a doctor invites a user to be their patient via chat
create table if not exists public.patient_invitations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(doctor_id, patient_user_id)
);

-- Enable RLS
alter table public.patient_invitations enable row level security;

-- Doctors can insert invitations they create
create policy "Doctors can insert their own invitations"
  on public.patient_invitations for insert
  with check (auth.uid() = doctor_id);

-- Doctors can read their sent invitations
create policy "Doctors can read their own invitations"
  on public.patient_invitations for select
  using (auth.uid() = doctor_id or auth.uid() = patient_user_id);

-- Patient can update status of their own invitation
create policy "Patients can update invitation status"
  on public.patient_invitations for update
  using (auth.uid() = patient_user_id);
