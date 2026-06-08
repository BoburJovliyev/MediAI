import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, scanType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const scanLabels: Record<string, string> = {
      xray: "rentgen",
      uzi: "UZI (ultratovush)",
      mrt: "MRT (magnit-rezonans tomografiya)",
    };
    const scanLabel = scanLabels[scanType] || scanType || "rentgen";

    const systemPrompt = `Sen tajribali radiologsan. Berilgan tibbiy tasvir (${scanLabel}) haqida batafsil tahlil ber.

Javobni quyidagi JSON formatda ber:
{
  "findings": ["topilma 1", "topilma 2"],
  "severity": "normal | mild | moderate | severe",
  "recommendation": "tavsiya matni",
  "regions": ["tekshirilgan hudud 1", "tekshirilgan hudud 2"],
  "recommended_doctor": "kardiolog | nevrolog | jarroh | ortoped va h.k."
}

Muhim: Faqat JSON qaytar, boshqa hech narsa qo'shma.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageBase64 } },
          { type: "text", text: `Bu ${scanLabel} tasvirini tahlil qil. Patologiyalar, o'smalar va boshqa anomaliyalarni aniqla.` },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: "Tibbiy tasvir taqdim etilmadi. Iltimos, umumiy rentgen tasvir tahlili namunasini ber.",
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_scan",
              description: "Return structured scan analysis results",
              parameters: {
                type: "object",
                properties: {
                  findings: { type: "array", items: { type: "string" }, description: "List of findings" },
                  severity: { type: "string", enum: ["normal", "mild", "moderate", "severe"] },
                  recommendation: { type: "string" },
                  regions: { type: "array", items: { type: "string" } },
                  recommended_doctor: { type: "string", description: "Recommended doctor specialty in Uzbek (e.g., 'Kardiolog', 'Jarroh')" },
                },
                required: ["findings", "severity", "recommendation", "regions", "recommended_doctor"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_scan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
      // Fallback: try parsing the content as JSON
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { findings: ["Tahlil natijasi olinmadi"], severity: "normal", recommendation: "Qayta urinib ko'ring", regions: [], recommended_doctor: "Umumiy amaliyot shifokori" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
