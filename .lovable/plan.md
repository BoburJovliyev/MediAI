# Medi AI — Mukammallashtirish rejasi

Siz tanlagan to'rt yo'nalishni bosqichlarga ajratdim. Har bir bosqich mustaqil — ketma-ket yoki kerakligini tanlab amalga oshirsa bo'ladi.

---

## 1-bosqich — Shifokor/bemor oqimi (eng yuqori qiymat)

Hozir platformada chat va AI bor, lekin haqiqiy "klinika" oqimi yo'q. Eng katta foydani shu beradi.

- **Qabulga yozilish (Appointments):** bemor shifokorning bo'sh vaqtidan slot tanlaydi; shifokor tasdiqlaydi/bekor qiladi. Kalendar ko'rinishi.
- **Retsept (Prescription):** shifokor dori nomi, doza, davomiylik bilan retsept yozadi; bemor profilida ko'rinadi va PDF qilib yuklab oladi.
- **Eslatmalar:** qabul vaqti va dori ichish vaqti uchun avtomatik bildirishnomalar (mavjud notifications tizimi orqali).
- **Video konsultatsiya:** chat ichidan video qo'ng'iroq tugmasi (WebRTC yoki tashqi xizmat).

```text
Bemor ──tanlaydi──> Bo'sh slot ──> Shifokor tasdiqlaydi ──> Eslatma + Chat/Video
                                          └──> Retsept yoziladi ──> PDF
```

## 2-bosqich — Chat va guruhlar

Mavjud Telegram uslubidagi chatni boyitamiz:

- **Xabarlarni qidirish** (chat ichida matn bo'yicha).
- **Typing indikatori** ("yozmoqda...") realtime orqali.
- **Pinned (qadalgan) xabarlar** — shifokor muhim e'lonni tepaga qadaydi.
- **Media albom** — suhbatdagi barcha rasm/fayllar bitta joyda.
- **Ovozli/video qo'ng'iroq** tugmasi (1-bosqich bilan birlashtirilishi mumkin).
- **Guruh e'lonlari** uchun reaksiya statistikasi va o'qilganlar soni.

## 3-bosqich — AI imkoniyatlari

- **Ovozli AI yordamchi:** mikrofon orqali savol berish (speech-to-text) va javobni o'qib berish (text-to-speech).
- **Streaming javoblar:** AI Assistant javobni token-token oqim bilan yozadi (hozir bir martada chiqadi).
- **Tahlillarni taqqoslash:** bemorning oldingi va yangi rentgen/MRT natijalarini AI yonma-yon solishtirib o'zgarishni izohlaydi.
- **Ko'p tilli AI:** javoblar foydalanuvchi tanlagan tilda (UZ/RU/EN) — i18n bilan bog'lanadi.
- **Har bir AI javobidan keyin majburiy tibbiy ogohlantirish** (mavjud qoidaga muvofiq) saqlanadi.

## 4-bosqich — Hisobot va analitika

- **Bemor progress grafiklari:** reab. seanslar, tahlil natijalari vaqt bo'yicha (Recharts).
- **PDF/Excel eksport:** bemor kartasi, tashxislar, retseptlar, reab. tarixini hujjat qilib yuklash.
- **Shifokor dashboard:** bemorlar soni, faol qabullar, oxirgi tahlillar bo'yicha yig'ma ko'rsatkichlar.
- **Admin monitoring kengaytmasi:** faollik jurnali (activity_log) bo'yicha grafiklar va filtrlash.

---

## Texnik tafsilotlar (ixtiyoriy o'qish)

**Yangi jadvallar (migration kerak, to'liq RLS + GRANT bilan):**
- `appointments` (doctor_id, patient_id, scheduled_at, status, notes) — bemor o'zinikini, shifokor o'zinikini ko'radi.
- `doctor_availability` (doctor_id, weekday, start_time, end_time) — shifokor boshqaradi, bemorlar o'qiydi.
- `prescriptions` (doctor_id, patient_id, medication, dosage, duration, notes) — tegishli taraflar ko'radi.
- `pinned_messages` yoki `chat_messages`ga `is_pinned` ustuni.

**Realtime:** typing indikatori uchun Supabase broadcast/presence; appointments va prescriptions uchun postgres_changes.

**AI:** mavjud `ai-chat` edge funksiyasini streaming'ga o'tkazish; ovoz uchun yangi `voice-transcribe` edge funksiyasi (Lovable AI orqali). Tahlil taqqoslash uchun `analyze-scan`ni kengaytirish.

**Eksport:** mavjud PDF generatsiya patternidan (Patient Reporting) foydalanib retsept va progress hisobotlarini qo'shamiz.

---

## Tavsiya etilgan tartib

1-bosqich (qabul + retsept) → eng katta amaliy qiymat. Keyin 4-bosqich (hisobot/eksport) bilan to'ldiramiz, so'ng 3-bosqich (AI streaming + ovoz) va 2-bosqich (chat boyitish).

Qaysi bosqichdan boshlaymiz? "Implement plan" bosing yoki bitta bosqichni tanlang — men shu bo'yicha yarataman.