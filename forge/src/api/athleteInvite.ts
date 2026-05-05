import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AthleteProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  slug: string | null
}

export interface InviteCode {
  id: string
  code: string
  label: string | null
  athleteSlug: string | null
  usedBy: string | null
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

// ─── Athlete sign-up ──────────────────────────────────────────────────────────

export async function athleteSignUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AthleteProfile> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  if (!data.user) throw new Error('Sign up failed.')

  // Create athlete profile
  const { error: profileErr } = await supabase
    .from('athlete_profiles')
    .insert({
      id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
    })
  if (profileErr) throw profileErr

  return { id: data.user.id, firstName, lastName, email, slug: null }
}

export async function athleteSignIn(
  email: string,
  password: string
): Promise<AthleteProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Incorrect email or password.')
  if (!data.user) throw new Error('Sign in failed.')
  return getAthleteProfile(data.user.id)
}

export async function athleteSignOut(): Promise<void> {
  await supabase.auth.signOut()
}

// ─── Athlete profile ──────────────────────────────────────────────────────────

export async function getAthleteProfile(userId: string): Promise<AthleteProfile> {
  const { data, error } = await supabase
    .from('athlete_profiles')
    .select('id, first_name, last_name, email, slug')
    .eq('id', userId)
    .single()

  if (error) throw error
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    slug: data.slug,
  }
}

export async function updateAthleteProfile(
  userId: string,
  patch: { firstName?: string; lastName?: string }
): Promise<void> {
  const { error } = await supabase
    .from('athlete_profiles')
    .update({
      ...(patch.firstName && { first_name: patch.firstName }),
      ...(patch.lastName  && { last_name:  patch.lastName }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
  if (error) throw error
}

// ─── Invite codes ─────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // no 0/O/1/I ambiguity
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createInviteCode(
  coachId: string,
  opts: { label?: string; athleteSlug?: string } = {}
): Promise<InviteCode> {
  const code = generateCode()
  const { data, error } = await supabase
    .from('athlete_invites')
    .insert({
      code,
      coach_id: coachId,
      label: opts.label ?? null,
      athlete_slug: opts.athleteSlug ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return mapInvite(data)
}

export async function getCoachInvites(coachId: string): Promise<InviteCode[]> {
  const { data, error } = await supabase
    .from('athlete_invites')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapInvite)
}

export async function deleteInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('athlete_invites')
    .delete()
    .eq('id', inviteId)
  if (error) throw error
}

// ─── Accept invite ────────────────────────────────────────────────────────────

export interface InviteLookup {
  id: string
  code: string
  coachId: string
  label: string | null
  athleteSlug: string | null
  isUsed: boolean
  isExpired: boolean
}

export async function lookupInviteCode(code: string): Promise<InviteLookup> {
  const { data, error } = await supabase
    .from('athlete_invites')
    .select('id, code, coach_id, label, athlete_slug, used_by, used_at, expires_at')
    .eq('code', code.toUpperCase().trim())
    .single()

  if (error || !data) throw new Error('Invite code not found.')

  return {
    id: data.id,
    code: data.code,
    coachId: data.coach_id,
    label: data.label,
    athleteSlug: data.athlete_slug,
    isUsed: !!data.used_by,
    isExpired: new Date(data.expires_at) < new Date(),
  }
}

export async function acceptInvite(
  inviteId: string,
  userId: string,
  coachId: string,
  athleteSlug: string | null
): Promise<void> {
  // 1. Mark invite as used
  await supabase
    .from('athlete_invites')
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq('id', inviteId)

  // 2. Link athlete profile slug if provided
  if (athleteSlug) {
    await supabase
      .from('athlete_profiles')
      .update({ slug: athleteSlug, updated_at: new Date().toISOString() })
      .eq('id', userId)
  }

  // 3. Create or update coach_athletes row
  const athleteId = athleteSlug ?? userId  // fall back to user id as identifier

  const { error } = await supabase
    .from('coach_athletes')
    .upsert({
      coach_id: coachId,
      athlete_id: athleteId,
      athlete_auth_id: userId,
    }, { onConflict: 'coach_id,athlete_id' })

  if (error) throw error
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function mapInvite(row: any): InviteCode {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    athleteSlug: row.athlete_slug,
    usedBy: row.used_by,
    usedAt: row.used_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }
}
