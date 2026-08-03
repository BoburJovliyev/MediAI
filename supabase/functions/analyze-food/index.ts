import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mealType, note } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!imageBase64) throw new Error("Rasm yuborilmadi");

    const systemPrompt = `Sen professional nutritsiolog va oziq-ovqat tahlilchisisan. Foydalanuvchi yuborgan ovqat rasmini tahlil qil.
Barcha matnlarni sof o'zbek tilida yoz. Kaloriya va nutrientlarni porsiya hajmiga qarab realistik baholab ber.
Ovqat turi: ${mealType || "noma'lum"}. Foydalanuvchi izohi: ${note || "yo'q"}.
"norm" — kunlik ratsion me'yorlariga mos bo'lsa, "high" — kaloriya yoki yog'/shakar ortiqcha bo'lsa, "low" — juda kam quvvatli bo'lsa.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageBase64 } },
              { type: "text", text: "Ushbu ovqat rasmini tahlil qil: taomlar, umumiy kaloriya, oqsil/yog'/uglevod, me'yorga mosligi va tavsiyalar." },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_food",
              description: "Return structured nutrition analysis for a food photo",
              parameters: {
                type: "object",
                properties: {
                  dish_name: { type: "string", description: "Taom nomi (o'zbekcha)" },
                  items: {
                    type: "array",
                    description: "Rasmda aniqlangan mahsulotlar",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        portion: { type: "string", description: "Taxminiy porsiya, masalan '150 g'" },
                        calories: { type: "number" },
                      },
                      required: ["name", "portion", "calories"],
                      additionalProperties: false,
                    },
                  },
                  total_calories: { type: "number" },
                  protein_g: { type: "number" },
                  fat_g: { type: "number" },
                  carbs_g: { type: "number" },
                  fiber_g: { type: "number" },
                  sugar_g: { type: "number" },
                  sodium_mg: { type: "number" },
                  health_score: { type: "number", description: "0-100 foydalilik bahosi" },
                  status: { type: "string", enum: ["norm", "high", "low"] },
                  daily_percent: { type: "number", description: "2000 kkal me'yordan necha foiz" },
                  verdict: { type: "string", description: "Qisqa xulosa: me'yorda yoki yo'q" },
                  recommendations: { type: "array", items: { type: "string" } },
                  warnings: { type: "array", items: { type: "string" } },
                },
                required: [
                  "dish_name", "items", "total_calories", "protein_g", "fat_g", "carbs_g",
                  "fiber_g", "sugar_g", "sodium_mg", "health_score", "status",
                  "daily_percent", "verdict", "recommendations", "warnings",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_food" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "So'rovlar chegarasi oshdi. Birozdan so'ng urinib ko'ring." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI kreditlari tugadi." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Tahlil natijasi olinmadi");
      result = JSON.parse(m[0]);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-food error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
