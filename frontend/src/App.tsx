import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { useAuthStore } from './store/authStore'
import { useUIStore } from './store/uiStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageLoader } from './components/ui/Spinner'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { RepositoriesPage } from './pages/RepositoriesPage'
import { PipelinesPage } from './pages/PipelinesPage'
import { ScansPage } from './pages/ScansPage'
import { ReportsPage } from './pages/ReportsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { CompliancePage } from './pages/CompliancePage'
import { AIAssistantPage } from './pages/AIAssistantPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { AuditLogsPage } from './pages/AuditLogsPage'
import { ActivityPage } from './pages/ActivityPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  const { theme } = useUIStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard"   element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path="/projects"    element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
            <Route path="/repositories" element={<ErrorBoundary><RepositoriesPage /></ErrorBoundary>} />
            <Route path="/pipelines"   element={<ErrorBoundary><PipelinesPage /></ErrorBoundary>} />
            <Route path="/scans"       element={<ErrorBoundary><ScansPage /></ErrorBoundary>} />
            <Route path="/reports"     element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
            <Route path="/analytics"   element={<ErrorBoundary><AnalyticsPage /></ErrorBoundary>} />
            <Route path="/notifications" element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} />
            <Route path="/compliance"  element={<ErrorBoundary><CompliancePage /></ErrorBoundary>} />
            <Route path="/ai-assistant" element={<ErrorBoundary><AIAssistantPage /></ErrorBoundary>} />
            <Route path="/settings"    element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="/profile"     element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
            <Route path="/audit"       element={<ErrorBoundary><AuditLogsPage /></ErrorBoundary>} />
            <Route path="/activity"    element={<ErrorBoundary><ActivityPage /></ErrorBoundary>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
