const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { food, scan, profile, trend } = await req.json();

    const systemPrompt = `Sen professional klinik nutritsiologsan. Sof o'zbek tilida yoz.
Foydalanuvchining oxirgi ovqat tahlili, so'nggi 14 kunlik kaloriya trendi va (mavjud bo'lsa) AI radiolog tahlili natijalariga asoslanib,
bosqichma-bosqich kunlik ratsion rejasini va menyuni tuz. Real o'zbek taomlaridan foydalan (mastava, shovla, non, qatiq, sabzavotlar...).
14 kunlik trendni tahlil qil: o'rtacha kaloriya me'yordan yuqori yoki past bo'lsa, rejani shunga moslashtir va buni "trend_insight" da tushuntir.
Har bosqich uchun taxminiy kaloriya va soatni ko'rsat. Maslahatlar dorivor tavsiya emas, faqat ovqatlanish bo'yicha.
Agar radiolog natijasi jiddiy bo'lsa — shifokorga murojaat qilish shartligini eslat.`;

    const userText = `Ovqat tahlili: ${JSON.stringify(food ?? {})}
Radiolog natijasi: ${JSON.stringify(scan ?? {})}
14 kunlik kaloriya trendi (kun: jami kkal): ${JSON.stringify(trend ?? [])}
Foydalanuvchi ma'lumoti: ${JSON.stringify(profile ?? {})}`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "build_meal_plan",
              description: "Kunlik bosqichma-bosqich ratsion rejasi",
              parameters: {
                type: "object",
                properties: {
                  target_calories: { type: "number" },
                  trend_insight: { type: "string", description: "14 kunlik kaloriya trendi tahlili" },

                  summary: { type: "string" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        time: { type: "string", description: "Masalan '08:00'" },
                        meal: { type: "string", description: "Nonushta / Tushlik / Kechki / Gazak" },
                        dish: { type: "string" },
                        portion: { type: "string" },
                        calories: { type: "number" },
                        why: { type: "string", description: "Nima uchun aynan shu taom" },
                      },
                      required: ["time", "meal", "dish", "portion", "calories", "why"],
                      additionalProperties: false,
                    },
                  },
                  avoid: { type: "array", items: { type: "string" } },
                  hydration: { type: "string" },
                  safety_notes: { type: "array", items: { type: "string" } },
                },
                required: ["target_calories", "summary", "steps", "avoid", "hydration", "safety_notes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_meal_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return json({ error: "So'rovlar chegarasi oshdi. Birozdan so'ng urinib ko'ring." }, 429);
      if (response.status === 402) return json({ error: "AI kreditlari tugadi." }, 402);
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
      if (!m) throw new Error("Reja olinmadi");
      result = JSON.parse(m[0]);
    }

    return json(result);
  } catch (e) {
    console.error("meal-plan error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
