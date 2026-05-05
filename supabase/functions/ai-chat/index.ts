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
    const { messages, userMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const systemPrompt = `Sen Medi AI - professional tibbiy yordamchisan. Faqat sog'liq va tibbiyotga oid savollarga javob ber.
O'zbek tilida, qisqa va tushunarli tilda javob ber (2-5 jumla). Markdown formatdan foydalan.
Jiddiy holatlarda albatta shifokorga murojaat qilishni tavsiya qil.
Javob oxirida qisqa eslatma: "⚠️ Bu AI maslahati, professional tibbiy maslahat o'rnini bosmaydi."`;

    const history = (messages || [])
      .filter((m: any) => m.role && m.content)
      .slice(-10)
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
          { role: "user", content: userMessage },
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
