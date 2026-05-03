import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import RosterPage from './pages/roster/RosterPage'
import AthleteDetailPage from './pages/athlete/AthleteDetailPage'
import ProgramLibraryPage from './pages/programs/ProgramLibraryPage'
import ProgramBuilderPage from './pages/programs/ProgramBuilderPage'
import AssignPage from './pages/programs/AssignPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/forge/login" element={<LoginPage />} />
        <Route path="/forge" element={<Layout />}>
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
      </Routes>
    </BrowserRouter>
  )
}
