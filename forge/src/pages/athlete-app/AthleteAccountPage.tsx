import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { athleteSignOut, getAthleteProfile } from '../../api/athleteInvite'
import { supabase } from '../../lib/supabase'
import { useAthleteStore } from '../../store/athleteStore'
import { AthleteLayout } from '../../components/AthleteLayout'

const C = {
  bg: '#F0EDE6', surface: '#FAFAF7', ink: '#1A1710',
  accent: '#8C6029', dim: '#998F85', rule: '#DDD9D0',
  error: '#C94F2A',
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Georgia,serif',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: C.dim,
  marginBottom: 14,
}

const inputStyle: React.CSSProperties = {
  height: 38,
  width: '100%',
  padding: '0 12px',
  background: C.surface,
  border: `1px solid ${C.rule}`,
  borderRadius: 4,
  fontSize: 14,
  color: C.ink,
  outline: 'none',
  boxSizing: 'border-box',
}

export function AthleteAccountPage() {
  const navigate = useNavigate()
  const { athlete, setAthlete, setLoading } = useAthleteStore()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [profileMsg, setProfileMsg] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [passwordErr, setPasswordErr] = useState('')
  const [coachName, setCoachName] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/forge/athlete/login', { replace: true })
        return
      }
      try {
        const profile = await getAthleteProfile(session.user.id)
        setAthlete(profile)
        setFirstName(profile.firstName)
        setLastName(profile.lastName)
        setEmail(profile.email)

        const { data: linkData } = await supabase
          .from('coach_athletes')
          .select('coach_id')
          .eq('athlete_auth_id', session.user.id)
          .limit(1)
          .maybeSingle()

        if (linkData?.coach_id) {
          const { data: coach } = await supabase
            .from('coach_profiles')
            .select('first_name, last_name')
            .eq('id', linkData.coach_id)
            .maybeSingle()
          if (coach) {
            setCoachName(`${coach.first_name} ${coach.last_name}`.trim())
          }
        }
      } catch {
        navigate('/forge/athlete/login', { replace: true })
      } finally {
        setLoading(false)
      }
    })
  }, [navigate, setAthlete, setLoading])

  const clearMessageAfter = (setter: (value: string) => void) => {
    setTimeout(() => setter(''), 2000)
  }

  const handleSignOut = async () => {
    await athleteSignOut()
    setAthlete(null)
    navigate('/forge/athlete/login', { replace: true })
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    const f = firstName.trim()
    const l = lastName.trim()
    setProfileErr('')
    setProfileMsg('')

    if (!f || !l || !athlete) {
      setProfileErr('First and last name are required.')
      return
    }

    const { error } = await supabase
      .from('athlete_profiles')
      .update({ first_name: f, last_name: l })
      .eq('id', athlete.id)

    if (error) {
      setProfileErr(error.message)
      return
    }

    setAthlete({ ...athlete, firstName: f, lastName: l })
    setProfileMsg('Saved.')
    clearMessageAfter(setProfileMsg)
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailErr('')
    setEmailMsg('')
    if (!email.trim()) {
      setEmailErr('Email is required.')
      return
    }

    const { error } = await supabase.auth.updateUser({ email: email.trim() })
    if (error) {
      setEmailErr(error.message)
      return
    }
    setEmailMsg('Saved.')
    clearMessageAfter(setEmailMsg)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordErr('')
    setPasswordMsg('')
    if (newPassword.length < 8) {
      setPasswordErr('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('Passwords do not match.')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordErr(error.message)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setPasswordMsg('Saved.')
    clearMessageAfter(setPasswordMsg)
  }

  if (!athlete) {
    return null
  }

  return (
    <AthleteLayout athlete={athlete} onSignOut={handleSignOut}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section style={{ background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 10, padding: 24 }}>
            <div style={sectionTitle}>Profile</div>
            <form onSubmit={handleSaveName} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div>
                <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" style={{ height: 36, padding: '0 16px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                  Save changes
                </button>
                {profileErr && <p style={{ marginTop: 8, fontSize: 12, color: C.error }}>{profileErr}</p>}
                {profileMsg && <p style={{ marginTop: 8, fontSize: 12, color: C.accent }}>{profileMsg}</p>}
              </div>
            </form>
          </section>

          <section style={{ background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 10, padding: 24 }}>
            <div style={sectionTitle}>Email</div>
            <form onSubmit={handleUpdateEmail}>
              <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
              <div style={{ marginTop: 10 }}>
                <button type="submit" style={{ height: 36, padding: '0 16px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                  Update email
                </button>
                {emailErr && <p style={{ marginTop: 8, fontSize: 12, color: C.error }}>{emailErr}</p>}
                {emailMsg && <p style={{ marginTop: 8, fontSize: 12, color: C.accent }}>{emailMsg}</p>}
              </div>
            </form>
          </section>

          <section style={{ background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 10, padding: 24 }}>
            <div style={sectionTitle}>Password</div>
            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={inputStyle} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" />
              <input style={inputStyle} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" type="password" />
              <div>
                <button type="submit" style={{ height: 36, padding: '0 16px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                  Update password
                </button>
                {passwordErr && <p style={{ marginTop: 8, fontSize: 12, color: C.error }}>{passwordErr}</p>}
                {passwordMsg && <p style={{ marginTop: 8, fontSize: 12, color: C.accent }}>{passwordMsg}</p>}
              </div>
            </form>
          </section>

          <section style={{ background: C.surface, border: `1px solid ${C.rule}`, borderRadius: 10, padding: 24 }}>
            <div style={sectionTitle}>Coach connection</div>
            {coachName ? (
              <p style={{ margin: 0, fontSize: 13, color: C.dim }}>
                Connected to {coachName}'s roster.
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: C.dim }}>
                Not connected. Enter an invite code to connect.{' '}
                <Link to="/forge/athlete/invite" style={{ color: C.accent }}>
                  Enter code
                </Link>
              </p>
            )}
          </section>
        </div>
      </div>
    </AthleteLayout>
  )
}
