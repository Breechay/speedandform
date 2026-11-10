import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createMcpHandler,
  McpServer,
} from "npm:@modelcontextprotocol/server@2.0.0";
import { pipeline } from "npm:@supabase/middleware@1.0.0";
import {
  withOAuthProtectedResource,
  withSupabase,
} from "npm:@supabase/server@1.6.0";
import { z } from "npm:zod@4.3.6";

import {
  assertDateWindow,
  ContractError,
  revisionFingerprint,
  toolFailure,
  toolResult,
  validateRevision,
} from "./core.mjs";

// No service-role client or supplied actor ID. The OAuth middleware verifies
// the FORM user JWT; all reads and RPCs use that signed-in user's RLS context.
const UUID = z.string().uuid();
const component = z.object({
  role: z.enum(["warm_up", "work", "recovery", "cool_down"]),
  shape: z.enum(["continuous", "repetitions"]),
  repeatCount: z.number().int().positive().optional(),
  distance: z.number().positive().optional(),
  distanceUnit: z.enum(["mi", "km", "m"]).optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  recoverySeconds: z.number().int().nonnegative().optional(),
  recoveryKind: z.enum(["float", "easy", "jog", "standing", "equal"])
    .optional(),
  paceLowSeconds: z.number().int().positive().optional(),
  paceHighSeconds: z.number().int().positive().optional(),
  rpeLow: z.number().int().min(1).max(10).optional(),
  rpeHigh: z.number().int().min(1).max(10).optional(),
  rpeSource: z.enum(["authored", "inherited"]).optional(),
  rpeDefaultVersion: z.string().optional(),
  repeatMinimum: z.number().int().positive().optional(),
  repeatTarget: z.number().int().positive().optional(),
  repeatProgression: z.number().int().positive().optional(),
  repeatCeiling: z.number().int().positive().optional(),
  countsTowardMarkId: UUID.optional(),
}).strict();

const revision = z.object({
  plannedSessionId: UUID,
  expectedVersionId: UUID,
  title: z.string().trim().min(1).max(160),
  intent: z.string().trim().min(1).max(1000),
  details: z.string().max(3000).nullable().default(null),
  changeReason: z.string().trim().min(8).max(1200),
  prescribedDistance: z.number().positive().max(100),
  distanceUnit: z.enum(["mi", "km", "m"]),
  prescribedDurationMinutes: z.number().int().positive().nullable().default(
    null,
  ),
  rpeLow: z.number().int().min(1).max(10).nullable().default(null),
  rpeHigh: z.number().int().min(1).max(10).nullable().default(null),
  components: z.array(component).min(1).max(32),
}).strict();

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const issue = (message: string, code = "FORM_UNAVAILABLE") =>
  new ContractError(message, code);
const haloRevision = z.object({
  athleteSlug: z.string().regex(/^[a-z0-9-]+$/),
  messageId: UUID,
  expectedBody: z.string(),
  newBody: z.string().trim().min(24).max(2000),
  reason: z.string().trim().min(8).max(1200),
}).strict();
const weekRevision = z.object({
  athleteSlug: z.string().regex(/^[a-z0-9-]+$/),
  weekId: UUID,
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  intent: z.string().trim().min(15).max(1500),
  mattersBecause: z.string().trim().min(15).max(1500),
  reason: z.string().trim().min(8).max(1200),
}).strict();
const focusRevision = z.object({
  athleteSlug: z.string().regex(/^[a-z0-9-]+$/),
  expectedFocusId: UUID.nullable(),
  body: z.string().trim().min(24).max(2500),
  effectiveOn: date,
  reason: z.string().trim().min(8).max(1200),
}).strict();

async function requireCoach(supabase: any, athleteId: string) {
  const { data, error } = await supabase.rpc("is_coach_member", {
    target_athlete_id: athleteId,
  });
  if (error || data !== true) {
    throw issue(
      "This FORM account has no coach access to the athlete.",
      "NOT_AUTHORIZED",
    );
  }
}

async function resolveAthlete(supabase: any, slug: string) {
  const { data, error } = await supabase.from("athletes")
    .select("id, slug, display_name, target_event, goal_label")
    .eq("slug", slug).maybeSingle();
  if (error || !data) {
    throw issue("Athlete unavailable to this FORM account.", "NOT_FOUND");
  }
  await requireCoach(supabase, data.id);
  return data;
}

async function currentSession(supabase: any, plannedSessionId: string) {
  const { data: session, error: sessionError } = await supabase.from(
    "planned_sessions",
  )
    .select(
      "id, athlete_id, week_id, scheduled_on, day_label, role, state, is_key",
    )
    .eq("id", plannedSessionId).maybeSingle();
  if (sessionError || !session) {
    throw issue("The session is unavailable.", "NOT_FOUND");
  }
  await requireCoach(supabase, session.athlete_id);
  const { data: version, error: versionError } = await supabase.from(
    "planned_session_versions",
  )
    .select(
      "id, version_number, title, intent, details, prescribed_distance, distance_unit, prescribed_duration_minutes, rpe_low, rpe_high, change_reason, created_at",
    )
    .eq("planned_session_id", plannedSessionId)
    .order("version_number", { ascending: false }).limit(1).maybeSingle();
  if (versionError || !version) {
    throw issue("The current session version is unavailable.");
  }
  const [
    { data: components, error: componentError },
    { data: week, error: weekError },
  ] = await Promise.all([
    supabase.from("planned_session_components")
      .select(
        "position,role,shape,repeat_count,distance,distance_unit,duration_seconds,recovery_seconds,recovery_kind,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high",
      )
      .eq("version_id", version.id).order("position"),
    supabase.from("training_weeks")
      .select("id, week_number, starts_on, ends_on, intent, matters_because")
      .eq("id", session.week_id).maybeSingle(),
  ]);
  if (componentError || weekError) {
    throw issue("The session anatomy or Week story could not be read.");
  }
  return { session, version, components: components || [], week };
}

async function trainingWindow(
  supabase: any,
  athleteId: string,
  from: string,
  to: string,
) {
  assertDateWindow(from, to);
  await requireCoach(supabase, athleteId);
  const [
    { data: sessions, error: sessionError },
    { data: weeks, error: weekError },
  ] = await Promise.all([
    supabase.from("planned_sessions")
      .select("id,scheduled_on,day_label,position,role,state,is_key,week_id")
      .eq("athlete_id", athleteId).gte("scheduled_on", from).lte(
        "scheduled_on",
        to,
      )
      .order("scheduled_on").order("position").limit(120),
    supabase.from("training_weeks")
      .select("id,week_number,starts_on,ends_on,intent,matters_because")
      .eq("athlete_id", athleteId).lte("starts_on", to).gte("ends_on", from)
      .order("starts_on"),
  ]);
  if (sessionError || weekError) {
    throw issue("The requested training window could not be read.");
  }
  const ids = (sessions || []).map((item: any) => item.id);
  const versions: any[] = [];
  const components: any[] = [];
  if (ids.length) {
    const { data, error } = await supabase.from("planned_session_versions")
      .select(
        "id,planned_session_id,version_number,title,intent,details,prescribed_distance,distance_unit,change_reason,created_at",
      )
      .in("planned_session_id", ids).order("version_number", {
        ascending: false,
      }).limit(1000);
    if (error) throw issue("Training versions could not be read.");
    const seen = new Set<string>();
    for (const item of data || []) {
      if (!seen.has(item.planned_session_id)) {
        versions.push(item);
        seen.add(item.planned_session_id);
      }
    }
    const versionIds = versions.map((item) => item.id);
    if (versionIds.length) {
      const { data: anatomy, error: anatomyError } = await supabase.from(
        "planned_session_components",
      )
        .select(
          "version_id,position,role,shape,repeat_count,distance,distance_unit,duration_seconds,recovery_seconds,recovery_kind,pace_low_seconds,pace_high_seconds",
        )
        .in("version_id", versionIds).order("position").limit(500);
      if (anatomyError) throw issue("Training component readback failed.");
      components.push(...(anatomy || []));
    }
  }
  // FORM strength is a dated mirror; its truth is not evidence of a Forge native
  // device. An unavailable source must remain visibly unknown.
  const strength = await supabase.rpc("coach_preview_strength_days", {
    p_athlete_id: athleteId,
    p_from: from,
    p_to: to,
  });
  return {
    asOf: new Date().toISOString(),
    sessions,
    versions,
    components,
    weeks,
    strengthMirror: strength.error
      ? { state: "unavailable" }
      : { state: "read", data: strength.data },
    forgeNativeDelivery: "unchecked",
    athleteDeviceVisibility: "unchecked",
  };
}

async function preview(supabase: any, parsed: z.infer<typeof revision>) {
  const proposed = validateRevision(parsed);
  const current = await currentSession(supabase, parsed.plannedSessionId);
  if (current.session.state !== "published") {
    throw issue(
      "Only a published session may be revised here.",
      "INVALID_STATE",
    );
  }
  if (current.version.id !== parsed.expectedVersionId) {
    throw issue(
      "The session has changed. Read its latest version before previewing again.",
      "VERSION_CONFLICT",
    );
  }
  const from = new Date(`${current.session.scheduled_on}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(`${current.session.scheduled_on}T00:00:00Z`);
  to.setUTCDate(to.getUTCDate() + 7);
  const neighborhood = await trainingWindow(
    supabase,
    current.session.athlete_id,
    from.toISOString().slice(0, 10),
    to.toISOString().slice(0, 10),
  );
  return {
    previewToken: await revisionFingerprint(proposed),
    before: current,
    proposed,
    adjacentWeek: neighborhood,
    mandatoryReview: [
      "Confirm Week story after saving",
      "Check adjacent quality and recovery",
      "Confirm linked Forge workload where available",
    ],
    previewOnly: true,
  };
}

async function safeTool(fn: () => Promise<unknown>) {
  try {
    return toolResult(await fn());
  } catch (error) {
    return toolFailure(error);
  }
}

Deno.serve(pipeline(
  [withOAuthProtectedResource(), withSupabase({ auth: "user" })],
  async (req, { supabase }) => {
    const handler = createMcpHandler(() => {
      const server = new McpServer({
        name: "FORM Coach Agent",
        version: "0.1.0",
      });

      server.registerTool("get_athlete_training_window", {
        description:
          "Read one authorized FORM athlete's dated training, current versions, typed anatomy, Week story and strength mirror. Use before proposing or revising work; do not infer native app delivery.",
        inputSchema: z.object({
          athleteSlug: z.string().regex(/^[a-z0-9-]+$/),
          from: date,
          to: date,
        }),
        annotations: { readOnlyHint: true },
      }, ({ athleteSlug, from, to }) =>
        safeTool(async () => {
          const athlete = await resolveAthlete(supabase, athleteSlug);
          return {
            athlete,
            ...(await trainingWindow(supabase, athlete.id, from, to)),
          };
        }));

      server.registerTool("get_athlete_coaching_context", {
        description:
          "Full coherent read of the same athlete: dossier case-file, Week/focus, Halo drafts and sent history, coach notes, Brice FORM evaluation and filing-earned points, Speed version links, and adjacent training. Each surface retains its original owner. Use before editing or saying the app is current.",
        inputSchema: z.object({
          athleteSlug: z.string().regex(/^[a-z0-9-]+$/),
          from: date,
          to: date,
        }),
        annotations: { readOnlyHint: true },
      }, ({ athleteSlug, from, to }) =>
        safeTool(async () => {
          const athlete = await resolveAthlete(supabase, athleteSlug);
          const [brief, linkage, training] = await Promise.all([
            supabase.rpc("coach_agent_athlete_brief", {
              p_athlete_id: athlete.id,
            }),
            supabase.rpc("coach_agent_athlete_linkage", {
              p_athlete_id: athlete.id,
            }),
            trainingWindow(supabase, athlete.id, from, to),
          ]);
          if (brief.error || linkage.error) {
            throw issue(
              "An athlete-linked source could not be read; no write is safe.",
              "CONTEXT_INCOMPLETE",
            );
          }
          return {
            athlete,
            dossier: brief.data,
            linkedSurfaces: linkage.data,
            training,
            evaluationExplanation:
              "FORM evaluation axes earn movement from eligible filings; coach-authored evaluation revisions add to the baseline. Do not infer points by counting prescribed workouts.",
            haloExplanation:
              "Halo approved, archived and already-opened messages are distinct. Keep the same message ID when approved weekly copy is refreshed, and preserve revision history.",
          };
        }));

      server.registerTool("get_coach_roster_story_audit", {
        description:
          "Read the existing coach-authorized roster-wide Dossier Week-story freshness audit. Flags exceptions but never rewrites individual plans or points.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      }, () =>
        safeTool(async () => {
          const { data, error } = await supabase.rpc(
            "coach_roster_story_audit",
          );
          if (error) {
            throw issue(
              "Authorized roster story audit unavailable.",
              "CONTEXT_INCOMPLETE",
            );
          }
          return {
            asOf: new Date().toISOString(),
            storyAudit: data,
            note:
              "A story exception needs a specific source reread and copy correction. This does not prove native device rendering.",
          };
        }));

      server.registerTool("preview_session_revision", {
        description:
          "Validate a complete proposed FORM session revision against the exact latest version, adjacent Week and strength mirror. Makes NO change. Present this preview to Brice before the commit.",
        inputSchema: revision,
        annotations: { readOnlyHint: true },
      }, (proposed) => safeTool(() => preview(supabase, proposed)));

      server.registerTool("commit_session_revision", {
        description:
          "Save Brice-authorized, previewed FORM coaching changes through the existing coach-only version writer. Requires the unchanged preview token. Atomic version precondition and idempotent retry; never silently deploy native code.",
        inputSchema: revision.extend({
          previewToken: z.string().regex(/^[a-f0-9]{64}$/),
        }),
      }, ({ previewToken, ...revisionInput }) =>
        safeTool(async () => {
          const proposed = validateRevision(revisionInput);
          const actualToken = await revisionFingerprint(proposed);
          if (previewToken !== actualToken) {
            throw issue(
              "Preview and commit differ; preview this exact revision again.",
              "PREVIEW_MISMATCH",
            );
          }
          const current = await currentSession(
            supabase,
            proposed.plannedSessionId,
          );
          if (current.version.id !== proposed.expectedVersionId) {
            // An idempotent retry is still safe; the writer handles that before
            // comparing current version. It will reject any changed payload.
            const previous = await supabase.rpc(
              "coach_agent_revision_receipt",
              {
                p_planned_session_id: proposed.plannedSessionId,
                p_request_key: actualToken,
              },
            );
            if (previous.error || !previous.data) {
              throw issue(
                "This session changed after preview. Reread before making a new edit.",
                "VERSION_CONFLICT",
              );
            }
          }
          const { data, error } = await supabase.rpc(
            "coach_agent_commit_session_revision",
            {
              p_planned_session_id: proposed.plannedSessionId,
              p_expected_version_id: proposed.expectedVersionId,
              p_request_key: actualToken,
              p_payload_hash: actualToken,
              p_title: proposed.title,
              p_intent: proposed.intent,
              p_details: proposed.details,
              p_change_reason: proposed.changeReason,
              p_prescribed_distance: proposed.prescribedDistance,
              p_distance_unit: proposed.distanceUnit,
              p_prescribed_duration_minutes: proposed.prescribedDurationMinutes,
              p_rpe_low: proposed.rpeLow,
              p_rpe_high: proposed.rpeHigh,
              p_components: proposed.components,
            },
          );
          if (error || !data?.new_version_id) {
            throw issue(
              "FORM did not confirm a saved version. Check the exact record before retrying.",
              "SAVE_UNCONFIRMED",
            );
          }
          try {
            const readback = await currentSession(
              supabase,
              proposed.plannedSessionId,
            );
            return {
              ...data,
              sourceReadbackVerified:
                readback.version.id === data.new_version_id,
              latestVersion: readback.version,
              weekStoryMustBeReconfirmed: true,
              linkedReconciliation: {
                status: "pending",
                mandatory: [
                  "Dossier Week story and focus revision",
                  "existing Halo weekly focus draft/approved/sent message",
                  "historical coach notes",
                  "Speed prescription-version links and filed evidence",
                  "FORM evaluation earned points",
                  "seven-day Forge impact",
                ],
              },
              athleteFeedVerified: false,
              nativeDeviceVerified: false,
              note:
                "A saved FORM version is not proof of the athlete-device render.",
            };
          } catch {
            return {
              ...data,
              sourceReadbackVerified: false,
              weekStoryMustBeReconfirmed: true,
              linkedReconciliation: { status: "pending" },
              athleteFeedVerified: false,
              nativeDeviceVerified: false,
              note:
                "Saved receipt returned, but readback failed. Reread; do not create another version blindly.",
            };
          }
        }));

      server.registerTool("get_session_revision_receipt", {
        description:
          "Read back a specific authenticated agent revision and its current version, without writing or retrying it.",
        inputSchema: z.object({
          plannedSessionId: UUID,
          requestKey: z.string().regex(/^[a-f0-9]{64}$/),
        }),
        annotations: { readOnlyHint: true },
      }, ({ plannedSessionId, requestKey }) =>
        safeTool(async () => {
          const current = await currentSession(supabase, plannedSessionId);
          const { data, error } = await supabase.rpc(
            "coach_agent_revision_receipt",
            {
              p_planned_session_id: plannedSessionId,
              p_request_key: requestKey,
            },
          );
          if (error || !data) {
            throw issue("Authorized revision receipt not found.", "NOT_FOUND");
          }
          return {
            ...data,
            sourceReadbackVerified: current.version.id === data.new_version_id,
            currentVersion: current.version,
            athleteFeedVerified: false,
            nativeDeviceVerified: false,
          };
        }));

      server.registerTool("preview_week_story_revision", {
        description:
          "Compare the proposed Dossier Week story with the exact current Week record. Read-only and copy-approval required.",
        inputSchema: weekRevision,
        annotations: { readOnlyHint: true },
      }, (proposal) =>
        safeTool(async () => {
          const athlete = await resolveAthlete(supabase, proposal.athleteSlug);
          const { data, error } = await supabase.from("training_weeks")
            .select(
              "id,athlete_id,intent,matters_because,updated_at,starts_on,ends_on",
            )
            .eq("id", proposal.weekId).eq("athlete_id", athlete.id)
            .maybeSingle();
          if (error || !data) {
            throw issue("Dossier Week is not available.", "NOT_FOUND");
          }
          if (
            new Date(data.updated_at).toISOString() !==
              new Date(proposal.expectedUpdatedAt).toISOString()
          ) {
            throw issue(
              "Week changed; reread before previewing.",
              "VERSION_CONFLICT",
            );
          }
          return {
            athlete,
            before: data,
            proposed: proposal,
            previewToken: await revisionFingerprint(proposal),
            previewOnly: true,
          };
        }));

      server.registerTool("commit_week_story_revision", {
        description:
          "After Brice approves exact copy, update the existing Dossier Week story with version precondition, historical audit and readback. The Week retains the same ID.",
        inputSchema: weekRevision.extend({
          previewToken: z.string().regex(/^[a-f0-9]{64}$/),
        }),
      }, ({ previewToken, ...proposal }) =>
        safeTool(async () => {
          if (
            previewToken !== await revisionFingerprint(proposal)
          ) {
            throw issue("Week copy differs from preview.", "PREVIEW_MISMATCH");
          }
          const athlete = await resolveAthlete(supabase, proposal.athleteSlug);
          const { data, error } = await supabase.rpc(
            "coach_agent_week_story_revise",
            {
              p_week_id: proposal.weekId,
              p_expected_updated_at: proposal.expectedUpdatedAt,
              p_intent: proposal.intent,
              p_matters_because: proposal.mattersBecause,
              p_reason: proposal.reason,
            },
          );
          if (error) {
            throw issue(
              "Week story save was not confirmed; reread the same Week.",
              "SAVE_UNCONFIRMED",
            );
          }
          const readback = await supabase.from("training_weeks")
            .select("id,athlete_id,intent,matters_because,updated_at").eq(
              "id",
              proposal.weekId,
            )
            .eq("athlete_id", athlete.id).maybeSingle();
          return {
            ...data,
            sourceReadbackVerified: !readback.error &&
              readback.data?.intent === proposal.intent &&
              readback.data?.matters_because === proposal.mattersBecause,
            readback: readback.data,
            nativeDeviceVerified: false,
          };
        }));

      server.registerTool("preview_athlete_focus_revision", {
        description:
          "Preview a new append-only Dossier athlete-focus revision and its existing effective history. No Halo or Week text is silently overwritten.",
        inputSchema: focusRevision,
        annotations: { readOnlyHint: true },
      }, (proposal) =>
        safeTool(async () => {
          const athlete = await resolveAthlete(supabase, proposal.athleteSlug);
          const { data, error } = await supabase.rpc(
            "coach_agent_athlete_linkage",
            { p_athlete_id: athlete.id },
          );
          if (error) {
            throw issue(
              "Existing focus history could not be read.",
              "CONTEXT_INCOMPLETE",
            );
          }
          const head = data?.focus_revisions?.[0] || null;
          if ((head?.id || null) !== proposal.expectedFocusId) {
            throw issue(
              "Focus head changed; reread first.",
              "VERSION_CONFLICT",
            );
          }
          return {
            athlete,
            before: head,
            proposed: proposal,
            previewToken: await revisionFingerprint(proposal),
            previewOnly: true,
          };
        }));

      server.registerTool("commit_athlete_focus_revision", {
        description:
          "After copy approval, append the exact athlete focus through its existing owning author function, with expected head and readback. Do not confuse focus with Halo or Week story.",
        inputSchema: focusRevision.extend({
          previewToken: z.string().regex(/^[a-f0-9]{64}$/),
        }),
      }, ({ previewToken, ...proposal }) =>
        safeTool(async () => {
          if (
            previewToken !== await revisionFingerprint(proposal)
          ) {
            throw issue("Focus copy differs from preview.", "PREVIEW_MISMATCH");
          }
          const athlete = await resolveAthlete(supabase, proposal.athleteSlug);
          const { data, error } = await supabase.rpc(
            "coach_agent_focus_revise",
            {
              p_athlete_id: athlete.id,
              p_expected_focus_id: proposal.expectedFocusId,
              p_body: proposal.body,
              p_effective_on: proposal.effectiveOn,
              p_reason: proposal.reason,
            },
          );
          if (error || !data?.focus_id) {
            throw issue(
              "Focus save unconfirmed. Reread before retry.",
              "SAVE_UNCONFIRMED",
            );
          }
          const readback = await supabase.rpc("coach_agent_athlete_linkage", {
            p_athlete_id: athlete.id,
          });
          const saved = (readback.data?.focus_revisions || []).find((
            item: any,
          ) => item.id === data.focus_id);
          return {
            ...data,
            saved,
            sourceReadbackVerified: !readback.error &&
              saved?.body === proposal.body,
            nativeDeviceVerified: false,
          };
        }));

      server.registerTool("preview_halo_focus_revision", {
        description:
          "Read the current approved Halo weekly message, drafts/archived notes and compare exact revised wording. Does not alter any message or create a duplicate.",
        inputSchema: haloRevision,
        annotations: { readOnlyHint: true },
      }, (proposal) =>
        safeTool(async () => {
          const athlete = await resolveAthlete(supabase, proposal.athleteSlug);
          const { data, error } = await supabase.rpc(
            "coach_agent_athlete_linkage",
            {
              p_athlete_id: athlete.id,
            },
          );
          if (error) {
            throw issue(
              "Halo state could not be reread.",
              "CONTEXT_INCOMPLETE",
            );
          }
          const current = (data?.halo_messages || []).find((message: any) =>
            message.id === proposal.messageId
          );
          if (
            !current || current.archived_at ||
            current.template_kind !== "weekly_focus" ||
            current.body !== proposal.expectedBody
          ) {
            throw issue(
              "Halo weekly message changed or was archived. Reread before preview.",
              "VERSION_CONFLICT",
            );
          }
          return {
            athlete,
            before: current,
            proposed: proposal,
            previewToken: await revisionFingerprint(proposal),
            previewOnly: true,
            willModifyExistingMessage: true,
            willCreateDuplicate: false,
          };
        }));

      server.registerTool("commit_halo_focus_revision", {
        description:
          "After Brice approves exact weekly Halo copy, revise the SAME active message with a saved before/after history, readback and no second send. Sent/opened history remains auditable.",
        inputSchema: haloRevision.extend({
          previewToken: z.string().regex(/^[a-f0-9]{64}$/),
        }),
      }, ({ previewToken, ...proposal }) =>
        safeTool(async () => {
          if (
            previewToken !== await revisionFingerprint(proposal)
          ) {
            throw issue("Halo copy differs from preview.", "PREVIEW_MISMATCH");
          }
          const athlete = await resolveAthlete(supabase, proposal.athleteSlug);
          const { data, error } = await supabase.rpc(
            "coach_agent_halo_focus_revise",
            {
              p_athlete_id: athlete.id,
              p_message_id: proposal.messageId,
              p_expected_body: proposal.expectedBody,
              p_new_body: proposal.newBody,
              p_reason: proposal.reason,
            },
          );
          if (error) {
            throw issue(
              "Halo save was not confirmed. Check the same message before retrying.",
              "SAVE_UNCONFIRMED",
            );
          }
          const readback = await supabase.rpc("coach_agent_athlete_linkage", {
            p_athlete_id: athlete.id,
          });
          const message = (readback.data?.halo_messages || []).find((
            item: any,
          ) => item.id === proposal.messageId);
          return {
            ...data,
            message,
            sourceReadbackVerified: !readback.error &&
              message?.body === proposal.newBody,
            nativeDeviceVerified: false,
            note:
              "No duplicate Halo note created. An already-opened version remains in private revision history; native rendering has not been checked.",
          };
        }));

      return server;
    });
    return handler.fetch(req);
  },
));
