import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY not set");

    // Build conversation history
    const historyText = (messages || [])
      .slice(-6)
      .map((m: any) => `${m.role === "user" ? "Bemor" : "AI Shifokor"}: ${m.content}`)
      .join("\n");

    const prompt = `Sen Medi AI - professional tibbiy yordamchisan. Faqat sog'liq va tibbiyotga tegishli savollarga javob ber. 
O'zbek tilida, qisqa va tushunarli tilda javob ber (2-4 jumla). 
Jiddiy holatlar uchun albatta shifokorga murojaat qilishni tavsiya qil.

${historyText ? `Oldingi suhbat:\n${historyText}\n\n` : ""}Bemor: ${userMessage}

Javob:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Kechirasiz, hozir javob bera olmayapman. Shifokorga murojaat qiling.";

    return new Response(JSON.stringify({ response: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        response: "Kechirasiz, xizmat vaqtincha mavjud emas. Shifokorga murojaat qiling." 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
