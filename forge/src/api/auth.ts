import { supabase } from '../lib/supabase'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Incorrect email or password.')
  if (!data.user) throw new Error('Incorrect email or password.')

  // Fetch coach profile
  const { data: profile, error: profileError } = await supabase
    .from('coach_profiles')
    .select('first_name, last_name, email')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) throw new Error('Coach profile not found.')

  return {
    id: data.user.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  const { data: profile } = await supabase
    .from('coach_profiles')
    .select('first_name, last_name, email')
    .eq('id', data.user.id)
    .single()

  if (!profile) return null

  return {
    id: data.user.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
  }
}

export async function updateProfile(firstName: string, lastName: string): Promise<void> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('coach_profiles')
    .update({ first_name: firstName, last_name: lastName })
    .eq('id', data.user.id)

  if (error) throw error
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
