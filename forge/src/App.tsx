import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RosterPage } from './pages/roster/RosterPage'
import { AthleteDetailPage } from './pages/athlete/AthleteDetailPage'
import { ProgramLibraryPage } from './pages/programs/ProgramLibraryPage'
import ProgramBuilderPage from './pages/programs/ProgramBuilderPage'
import { AssignPage } from './pages/programs/AssignPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthGuard } from './components/AuthGuard'
import { useAuthStore } from './store/authStore'
import { AthleteLoginPage } from './pages/athlete-app/AthleteLoginPage'
import { AthleteInvitePage } from './pages/athlete-app/AthleteInvitePage'
import { AthleteDashboard } from './pages/athlete-app/AthleteDashboard'
import { AthleteAccountPage } from './pages/athlete-app/AthleteAccountPage'
import { AthleteLedgerPage } from './pages/athlete-app/AthleteLedgerPage'
import { TheFieldPage } from './pages/field/TheFieldPage'
import { MiamiFieldPage } from './pages/field/MiamiFieldPage'
import { FieldAthleteProfilePage } from './pages/field/FieldAthleteProfilePage'


// ── ForgeMark animated loading indicator ──────────────────────
// Mirrors ForgeMark.swift: 5 bars, bottom-aligned, ascending left to right.
// Each bar pulses in sequence with a staggered delay.
function ForgeMarkAnimated() {
  const bars = [
    { height: 11, delay: '0ms'   },
    { height: 15, delay: '80ms'  },
    { height: 19, delay: '160ms' },
    { height: 22, delay: '240ms' },
    { height: 26, delay: '320ms' },
  ]
  const totalWidth = bars.length * 5 + (bars.length - 1) * 4  // barW=5 gap=4

  return (
    <div>
      <style>{`
        @keyframes forge-bar-pulse {
          0%, 100% { opacity: 0.25; transform: scaleY(0.75); }
          50%       { opacity: 1;    transform: scaleY(1);    }
        }
      `}</style>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        width: totalWidth,
        height: 32,
      }}>
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              width: 5,
              height: bar.height,
              borderRadius: 2.5,
              background: 'var(--color-accent)',
              transformOrigin: 'bottom',
              animation: `forge-bar-pulse 1s ease-in-out ${bar.delay} infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function FormFieldAthleteRedirect() {
  const { athleteSlug = '' } = useParams<{ athleteSlug: string }>()
  return <Navigate to={`/forge/field/${athleteSlug}`} replace />
}

export function App() {
  const loading = useAuthStore(s => s.loading)

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}>
        <ForgeMarkAnimated />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/forge/login" element={<LoginPage />} />
        {/* Athlete routes — separate auth context from coach */}
        <Route path="/forge/athlete/login" element={<AthleteLoginPage />} />
        <Route path="/forge/athlete/invite" element={<AthleteInvitePage />} />
        <Route path="/forge/athlete" element={<Navigate to="/forge/athlete/ledger" replace />} />
        <Route path="/forge/athlete/dashboard" element={<AthleteDashboard />} />
        <Route path="/forge/athlete/account" element={<AthleteAccountPage />} />
        <Route path="/forge/athlete/ledger" element={<AthleteLedgerPage />} />
        <Route path="/forge/field" element={<TheFieldPage />} />
        <Route path="/forge/field/miami" element={<MiamiFieldPage />} />
        <Route path="/forge/field/:athleteSlug" element={<FieldAthleteProfilePage />} />
        {/* Canonical Field path is /forge/field; keep /form aliases to avoid link drift */}
        <Route path="/form/field" element={<Navigate to="/forge/field" replace />} />
        <Route path="/form/field/miami" element={<Navigate to="/forge/field/miami" replace />} />
        <Route path="/form/field/:athleteSlug" element={<FormFieldAthleteRedirect />} />
        <Route path="/forge" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index element={<Navigate to="/forge/roster" replace />} />
          <Route path="roster" element={<RosterPage />} />
          <Route path="roster/:athleteId" element={<AthleteDetailPage />} />
          <Route path="programs" element={<ProgramLibraryPage />} />
          <Route path="programs/new" element={<ProgramBuilderPage />} />
          <Route path="programs/:id" element={<ProgramBuilderPage />} />
          <Route path="programs/:id/assign" element={<AssignPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/forge/roster" replace />} />
        <Route path="*" element={<Navigate to="/forge/roster" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
