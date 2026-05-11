## Maqsad
Telegram-kanal uslubidagi shifokor guruhlarini yaratish, chat moduli tablarini qayta tartiblash va shifokorlar ro'yxatidan to'g'ridan-to'g'ri chatga o'tish.

## 1. Database (migration)

Yangi jadvallar:
- **`doctor_groups`** — `id`, `doctor_id` (unique), `name`, `description`, `avatar_url`, `specialty`, `created_at`
  - Har bir shifokor uchun bitta guruh (auto-yaratiladi trigger orqali profil shifokor bo'lganda yoki birinchi bemor qo'shilganda).
  - Nom: `"Dr. {full_name} — {specialty}"` (rasmdagi formatga mos).
- **`group_members`** — `id`, `group_id`, `user_id` (patient), `joined_at`, unique(group_id, user_id)
  - Trigger: `doctor_patients` ga insert bo'lganda → `group_members` ga avtomatik qo'shadi.
- **`group_messages`** — `id`, `group_id`, `sender_id` (faqat doctor), `message`, `image_url`, `file_url`, `file_name`, `created_at`, `is_deleted`

RLS policies:
- `doctor_groups` SELECT: faqat group a'zolari (member yoki doctor egasi yoki admin) ko'radi → boshqa foydalanuvchilar topa olmaydi va kira olmaydi.
- `group_members` SELECT: faqat o'sha guruh a'zolari va doctor egasi.
- `group_messages` SELECT: faqat group_members yoki doctor.
- `group_messages` INSERT: faqat `auth.uid() = group.doctor_id` (Telegram-kanal uslubi — bemorlar yoza olmaydi).
- `group_messages` UPDATE/DELETE: faqat doctor.
- Super admin barcha guruhlarni ko'radi (nazorat).

Triggerlar:
- `handle_new_doctor_patient`: `doctor_patients` ga insert bo'lganda guruhni topadi/yaratadi va patientni `group_members` ga qo'shadi.
- `ensure_doctor_group_on_profile`: shifokor profili yaratilganda/yangilanganda guruh yaratadi.

Realtime: `group_messages` jadvali uchun `ALTER PUBLICATION supabase_realtime ADD TABLE`, `REPLICA IDENTITY FULL`.

## 2. ChatModule UI qayta dizayni

Tablar (rasm misolidagi kabi):
1. **All chats** — barcha shaxsiy chatlar + guruh chatlari aralash (oxirgi xabar bo'yicha tartiblangan), o'qilmagan badgesi.
2. **Contacts** — yozishgan shaxsiy foydalanuvchilar va shifokorlar.
3. **Groups** — foydalanuvchi a'zo bo'lgan barcha doctor guruhlari (avatar + doctor ismi + specialty).

Har bir tab ustida o'qilmagan xabarlar soni `Badge` orqali ko'rinadi.

Guruh ochilganda:
- Doctor uchun: yozish input ko'rinadi, xabar yuborishi mumkin.
- Bemor uchun: input o'rniga "Faqat shifokor xabar yozishi mumkin" matni (Telegram channel kabi).
- Header: guruh avatar + nomi + a'zolar soni.

## 3. DoctorsListing'dan chatga o'tish

`DoctorsListing.tsx` — har bir shifokor kartasi `cursor-pointer` bo'ladi. Bosilganda:
- `localStorage.setItem("open_chat_with", doctor.user_id)` 
- `window.dispatchEvent(new CustomEvent("app:navigate", { detail: { tab: "chat" } }))`

`ChatModule.tsx` mount bo'lganda `open_chat_with` ni o'qib, o'sha shifokor bilan chatni ochadi (Contacts tabini tanlab, profile ochiladi).

## 4. Realtime va sinxronizatsiya

- `group_messages` realtime kanali — yangi xabar kelganda barcha a'zolar darhol ko'radi.
- O'qilmagan xabarlar uchun `group_message_reads` keyinchalik (hozircha local state — bu MVP).

## Texnik tafsilotlar

**Files yangilanadi:**
- `supabase/migrations/<new>.sql` — jadvallar, RLS, triggerlar
- `src/components/modules/ChatModule.tsx` — uch tab tizimi, group view
- `src/components/modules/DoctorsListing.tsx` — kartaga onClick
- `src/integrations/supabase/types.ts` — auto

**Cheklov tasdiqlash:** Bemor doctorga ulanmagan bo'lsa → guruhni RLS qaytarmaydi (ko'rmaydi, topa olmaydi). Faqat `doctor_patients` orqali ulanish bor bo'lsa trigger uni `group_members` ga qo'shadi.
