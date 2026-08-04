import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Avtorizatsiya talab qilinadi" }, 401);

    const client = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await client.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sessiya yaroqsiz" }, 401);

    const { data: isAdmin } = await client.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Faqat super admin uchun" }, 403);

    // --- Runtime / server metrics ---
    const mem = (Deno as any).memoryUsage?.() ?? { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
    const sysMemTotal = (Deno as any).systemMemoryInfo?.()?.total ?? null;
    const loadAvg = (() => { try { return (Deno as any).loadavg?.() ?? null; } catch { return null; } })();

    // --- Database latency probe ---
    const t0 = performance.now();
    const { count: profileCount } = await client.from("profiles").select("id", { count: "exact", head: true });
    const dbLatency = Math.round(performance.now() - t0);

    const [scans, diagnoses, messages, notifications, foods] = await Promise.all([
      client.from("scan_analyses").select("id", { count: "exact", head: true }),
      client.from("diagnoses").select("id", { count: "exact", head: true }),
      client.from("chat_messages").select("id", { count: "exact", head: true }),
      client.from("notifications").select("id", { count: "exact", head: true }),
      client.from("food_logs").select("id", { count: "exact", head: true }),
    ]);

    // recent activity volume (last 24h) as a load proxy
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count: last24h } = await client
      .from("activity_log").select("id", { count: "exact", head: true }).gte("created_at", since);

    return json({
      generated_at: new Date().toISOString(),
      runtime: {
        deno: (Deno as any).version?.deno ?? "unknown",
        v8: (Deno as any).version?.v8 ?? "unknown",
        typescript: (Deno as any).version?.typescript ?? "unknown",
        region: Deno.env.get("SB_REGION") ?? Deno.env.get("DENO_REGION") ?? "auto",
        uptime_s: Math.round((Deno as any).osUptime?.() ?? 0),
      },
      memory: {
        rss_mb: +(mem.rss / 1048576).toFixed(1),
        heap_total_mb: +(mem.heapTotal / 1048576).toFixed(1),
        heap_used_mb: +(mem.heapUsed / 1048576).toFixed(1),
        external_mb: +(mem.external / 1048576).toFixed(1),
        system_total_mb: sysMemTotal ? +(sysMemTotal / 1024).toFixed(0) : null,
        heap_percent: mem.heapTotal ? +((mem.heapUsed / mem.heapTotal) * 100).toFixed(1) : 0,
      },
      cpu: {
        load_avg: loadAvg,
        cores: (navigator as any)?.hardwareConcurrency ?? null,
      },
      database: {
        latency_ms: dbLatency,
        status: dbLatency < 150 ? "healthy" : dbLatency < 600 ? "degraded" : "slow",
        rows: {
          profiles: profileCount ?? 0,
          scan_analyses: scans.count ?? 0,
          diagnoses: diagnoses.count ?? 0,
          chat_messages: messages.count ?? 0,
          notifications: notifications.count ?? 0,
          food_logs: foods.count ?? 0,
        },
      },
      traffic: { activity_last_24h: last24h ?? 0 },
    });
  } catch (e) {
    console.error("system-metrics error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
