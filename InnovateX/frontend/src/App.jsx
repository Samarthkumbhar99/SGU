import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/index.js'
import LoginPage from './features/auth/LoginPage.jsx'
import SignupPage from './features/auth/SignupPage.jsx'
import AuthCallback from './features/auth/AuthCallback.jsx'
import LandingPage from './features/landing/LandingPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import NetworkExplorerPage from './features/network/NetworkExplorerPage.jsx'
import NetworkMapPage from './features/map/NetworkMapPage.jsx'
import OptimizationWorkbenchPage from './features/optimization/OptimizationWorkbenchPage.jsx'
import DisruptionSimulatorPage from './features/scenarios/DisruptionSimulatorPage.jsx'
import RunHistoryPage from './features/scenarios/RunHistoryPage.jsx'
import DemandForecastingPage from './features/forecasting/DemandForecastingPage.jsx'
import InventoryMatrixPage from './features/inventory/InventoryMatrixPage.jsx'
import InventoryPage from './features/inventory/InventoryPage.jsx'
import PlaceholderPage from './features/shared/PlaceholderPage.jsx'
import RayOnboardingPage from './features/onboarding/RayOnboardingPage.jsx'
import SearchPage from './features/search/SearchPage.jsx'
import ProfilePage from './features/profile/ProfilePage.jsx'
import AiReportPage from './features/reports/AiReportPage.jsx'
import PlansPage from './features/plans/PlansPage.jsx'
import SupplyShieldConcierge from './features/landing/SupplyShieldConcierge.jsx'

// Global AI Chatbot wrapper (active everywhere except /login and /signup)
function GlobalChatbot() {
  const location = useLocation()
  const path = location.pathname.toLowerCase()
  if (path === '/login' || path === '/signup') {
    return null
  }
  return <SupplyShieldConcierge />
}

// Protected route wrapper
function ProtectedRoute({ children, allowUnonboarded = false }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  // First time after login or signup: redirect to AI onboarding if not yet onboarded
  if (user && user.isOnboarded === false && !allowUnonboarded) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

// Public route wrapper (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

// Root route handler — catches OAuth redirect params (code or token) or renders public landing page
function RootRoute() {
  const search = window.location.search
  if (search.includes('code=') || search.includes('token=') || search.includes('error=')) {
    return <AuthCallback />
  }
  return <LandingPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />
        <Route path="/landing" element={<LandingPage />} />

        {/* Protected routes */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowUnonboarded={true}>
              <RayOnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/network-map"
          element={
            <ProtectedRoute>
              <NetworkMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/network-explorer"
          element={
            <ProtectedRoute>
              <NetworkExplorerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryMatrixPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory-table"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forecasting"
          element={
            <ProtectedRoute>
              <DemandForecastingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rescue"
          element={
            <ProtectedRoute>
              <DisruptionSimulatorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/optimization"
          element={
            <ProtectedRoute>
              <OptimizationWorkbenchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scenarios"
          element={
            <ProtectedRoute>
              <RunHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PlaceholderPage
                title="Settings & Data Management"
                breadcrumbs={['Dashboard', 'Settings']}
                description="User profile, warehouse/store management, product catalog, transport lanes, demo dataset reset, and service health. Coming in Phase 8."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <AiReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
        />

        {/* OAuth Callback route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Default redirect */}
        <Route path="/" element={<RootRoute />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <GlobalChatbot />
    </BrowserRouter>
  )
}
