import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

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
    global: { headers: { Authorization: `Bearer ${token}` } }
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const payload = await req.json()
  const serviceClient = createClient(supabaseUrl, serviceKey)

  const { error: sessionError } = await serviceClient
    .from("strength_sessions")
    .upsert({
      id: payload.id,
      athlete_id: user.id,
      session_name: payload.sessionName,
      started_at: payload.startedAt,
      completed_at: payload.completedAt,
      duration_seconds: payload.durationSeconds,
      feedback: payload.feedback,
    }, { onConflict: "id" })

  if (sessionError) {
    return new Response(JSON.stringify({ error: sessionError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }

  if (payload.sets?.length > 0) {
    const setRows = payload.sets.map((s: any) => ({
      id: s.id,
      session_id: payload.id,
      movement_id: s.movementId,
      movement_name: s.movementName,
      set_index: s.setIndex,
      weight: s.weight,
      reps: s.reps,
      is_pr: s.isPr,
      completed_at: s.completedAt,
    }))

    const { error: setsError } = await serviceClient
      .from("set_logs")
      .upsert(setRows, { onConflict: "id" })

    if (setsError) {
      return new Response(JSON.stringify({ error: setsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
})
