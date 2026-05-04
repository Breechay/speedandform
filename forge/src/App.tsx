import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RosterPage } from './pages/roster/RosterPage'
import { AthleteDetailPage } from './pages/athlete/AthleteDetailPage'
import { ProgramLibraryPage } from './pages/programs/ProgramLibraryPage'
import ProgramBuilderPage from './pages/programs/ProgramBuilderPage'
import { AssignPage } from './pages/programs/AssignPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuthGuard } from './components/AuthGuard'
import { useAuthStore } from './store/authStore'

export function App() {
  const loading = useAuthStore(s => s.loading)

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 24,
          height: 24,
          border: '2.5px solid var(--color-rule)',
          borderTopColor: 'var(--color-accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/forge/login" element={<LoginPage />} />
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
