import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { complaint, bloodResults, mriSummary, age, gender } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Sen tajribali shifokor va diagnostik AI yordamchisan. Bemor ma'lumotlarini tahlil qilib, tashxis va dori tavsiyalari ber.

MUHIM OGOHLANTIRISH: Bu faqat dastlabki AI tahlili bo'lib, yakuniy tashxis emas. Har doim "Disclaimer" qo'sh.

Bemor ma'lumotlari:
- Yosh: ${age || "noma'lum"}
- Jins: ${gender || "noma'lum"}
- Shikoyat: ${complaint}
- Qon tahlili: ${bloodResults || "mavjud emas"}
- MRT/Rentgen xulosasi: ${mriSummary || "mavjud emas"}`;

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
          { role: "user", content: `Iltimos, quyidagi bemor uchun batafsil tashxis va dori tavsiyalarini ber.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_diagnosis",
              description: "Provide structured medical diagnosis and recommendations",
              parameters: {
                type: "object",
                properties: {
                  condition: { type: "string", description: "Diagnosed condition name" },
                  confidence: { type: "number", description: "Confidence percentage 0-100" },
                  description: { type: "string", description: "Detailed description in Uzbek" },
                  medications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        dose: { type: "string" },
                        frequency: { type: "string" },
                        duration: { type: "string" },
                      },
                      required: ["name", "dose", "frequency", "duration"],
                      additionalProperties: false,
                    },
                  },
                  lifestyle: {
                    type: "array",
                    items: { type: "string" },
                    description: "Lifestyle recommendations in Uzbek",
                  },
                },
                required: ["condition", "confidence", "description", "medications", "lifestyle"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_diagnosis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { condition: "Tahlil amalga oshmadi", confidence: 0, description: "Qayta urinib ko'ring", medications: [], lifestyle: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
