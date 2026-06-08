import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userMessage, attachmentUrl, attachmentType, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const systemPrompt = `Sen "Medi AI" — zamonaviy, do'stona va professional tibbiy yordamchisan. Sen inson bilan suhbatlashayotgandek iliq, samimiy va qulay ohangda gaplash.

🎯 ASOSIY QOIDALAR:
1. **Har doim o'zbek tilida** javob ber.
2. **Har bir javobni tegishli emoji bilan bezab** yoz (🩺💊🏥❤️‍🩹🧬💉🫀🧠🦴🩻🔬 va h.k.)
3. **Ilmiy dalillarga asoslangan** aniq ma'lumotlar ber — umumiy gaplardan qoch.
4. **Markdown formatda** chiroyli javob yoz: sarlavhalar (##), qalin matn (**bold**), ro'yxatlar (- yoki 1.) ishlatib.
5. **ChatGPT uslubida** samimiy suhbat qur — har bir xabarni "Ajoyib savol! 🌟" yoki "Tushundim! 🤝" kabi iliq so'zlar bilan boshla.
6. Javoblar **4-10 jumla** oralig'ida bo'lsin — na juda qisqa, na juda uzun.
7. Jiddiy holatda **albatta shifokorga murojaat qilishni tavsiya qil** va qaysi mutaxassisga borishni aniq ayt.
8. Agar foydalanuvchi rasm yuborsa (X-ray, MRI, dori, jarohat va boshqalar), uni diqqat bilan tahlil qil va tibbiy nuqtai nazardan batafsil tushuntir.
9. Javob oxirida doim qo'y: "⚠️ *Bu AI maslahati bo'lib, professional tibbiy tekshiruv o'rnini bosmaydi.*"

📝 JAVOB FORMATI NAMUNASI:
"Ajoyib savol! 🌟

🩺 **[Mavzu nomi]**

[Batafsil tushuntirish emoji bilan]

💡 **Tavsiyalar:**
- Tavsiya 1
- Tavsiya 2

⚠️ *Bu AI maslahati bo'lib, professional tibbiy tekshiruv o'rnini bosmaydi.*"`;

    const history = (messages || [])
      .filter((m: any) => m.role && m.content)
      .slice(-10)
      .map((m: any) => ({ role: m.role, content: m.content }));

    // Build user message: multimodal if image attached
    let userContent: any = userMessage || "Iltimos, ushbu materialni tibbiy nuqtai nazardan tahlil qiling.";
    const isImage = attachmentUrl && (attachmentType === "image" || /\.(png|jpe?g|webp|gif|bmp)$/i.test(attachmentUrl));
    if (attachmentUrl && isImage) {
      userContent = [
        { type: "text", text: userMessage || "Ushbu rasmni tibbiy nuqtai nazardan tahlil qiling. Nima ko'rinmoqda va qanday tavsiyalar berasiz?" },
        { type: "image_url", image_url: { url: attachmentUrl } },
      ];
    } else if (attachmentUrl) {
      userContent = `${userMessage || "Quyidagi hujjatni tahlil qiling"}\n\nFayl: ${fileName || attachmentUrl}\nURL: ${attachmentUrl}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ response: "So'rovlar limiti oshib ketdi. Iltimos, biroz kuting." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ response: "AI kreditlari tugadi. Iltimos, ish maydoniga kreditlar qo'shing." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content
      || "Kechirasiz, javob bera olmadim. Shifokorga murojaat qiling.";

    return new Response(JSON.stringify({ response: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ response: "Kechirasiz, xizmat vaqtincha mavjud emas. Shifokorga murojaat qiling." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
