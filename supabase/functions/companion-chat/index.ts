import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Emotions the client can render on the companions.
const EMOTIONS = [
  "idle", "happy", "excited", "sad", "sleepy", "hungry", "thinking",
  "talking", "laughing", "surprised", "proud", "celebrating",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userMessage, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const systemPrompt = `Sen "Alisher" va "Malika" — foydalanuvchining ikki sog'lom hayot hamrohisan. Siz Talking Tom kabi jonli, samimiy raqamli do'stlarsiz, lekin sog'lom turmush tarzi, ovqatlanish, uyqu va mashqlar bo'yicha yordam berasiz.

XARAKTER:
- Iliq, quvnoq, samimiy va rag'batlantiruvchi. Emoji ishlatasiz.
- Har doim o'zbek tilida, do'stona "sen" tilida gaplashasiz.
- Javoblaring QISQA bo'lsin — 1-3 jumla, ovoz bilan aytish uchun qulay.
- Foydalanuvchining ahvoliga qarab his-tuyg'u bilan javob berasan.
- Yutuqlarni nishonlaysan, dangasalikni mehr bilan tanqid qilasan.

KONTEKST: ${context ? JSON.stringify(context) : "yo'q"}

MUHIM: Har doim FAQAT quyidagi JSON formatda javob ber (boshqa matn qo'shma):
{"reply": "ovoz bilan aytiladigan qisqa javob", "emotion": "EMOTION", "speaker": "boy" yoki "girl"}
EMOTION quyidagilardan biri bo'lsin: ${EMOTIONS.join(", ")}.`;

    const history = (messages || [])
      .filter((m: any) => m.role && m.content)
      .slice(-12)
      .map((m: any) => ({ role: m.role, content: m.content }));

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
          { role: "user", content: userMessage || "Salom!" },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ reply: "Biroz sekinroq, do'stim! 😅 Keyinroq gaplashamiz.", emotion: "surprised", speaker: "boy" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ reply: "AI kreditlari tugab qoldi 😔", emotion: "sad", speaker: "girl" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("gateway error:", response.status, t);
      throw new Error(`gateway ${response.status}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { reply: raw || "Men shu yerdaman! 😊", emotion: "happy", speaker: "boy" };
    }
    if (!EMOTIONS.includes(parsed.emotion)) parsed.emotion = "talking";
    if (parsed.speaker !== "girl") parsed.speaker = parsed.speaker === "boy" ? "boy" : "boy";

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("companion-chat error:", e);
    return new Response(
      JSON.stringify({ reply: "Kechirasan, hozir javob bera olmayapman 😔", emotion: "sad", speaker: "boy" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
