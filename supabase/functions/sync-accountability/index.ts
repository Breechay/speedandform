import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 })
  }
  const token = authHeader.replace("Bearer ", "")
  const anonKey = req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = await req.json()
  const kind = body.kind as string

  if (kind === "intake") {
    const p = body.payload
    const { error } = await userClient.from("intake_logs").upsert({
      id: p.id,
      athlete_id: user.id,
      program_id: p.programId,
      eaten_at: p.eatenAt,
      text: p.text ?? null,
      anchor: p.anchor ?? null,
      had_protein: p.hadProtein ?? null,
      alcohol: !!p.alcohol,
      recorded_at: p.recordedAt ?? p.eatenAt,
    }, { onConflict: "id" })
    if (error) {
      return json({ error: error.message }, 500)
    }
    return json({ ok: true })
  }

  if (kind === "waist") {
    const p = body.payload
    const { error } = await userClient.from("waist_check_ins").upsert({
      id: p.id,
      athlete_id: user.id,
      program_id: p.programId,
      recorded_at: p.recordedAt,
      waist_inches: p.waistInches,
      entered_by: p.enteredBy ?? "athlete",
    }, { onConflict: "id" })
    if (error) {
      return json({ error: error.message }, 500)
    }
    return json({ ok: true })
  }

  if (kind === "heartbeat") {
    const lastOpenAt = body.payload?.lastOpenAt ?? new Date().toISOString()
    const { error } = await userClient.from("athlete_app_state").upsert({
      athlete_id: user.id,
      last_open_at: lastOpenAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: "athlete_id" })
    if (error) {
      return json({ error: error.message }, 500)
    }
    return json({ ok: true })
  }

  return json({ error: "Unknown kind" }, 400)
})

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
