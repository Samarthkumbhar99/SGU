import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/index.js'
import LoginPage from './features/auth/LoginPage.jsx'
import SignupPage from './features/auth/SignupPage.jsx'
import AuthCallback from './features/auth/AuthCallback.jsx'
import LandingPage from './features/landing/LandingPage.jsx'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import PlaceholderPage from './features/shared/PlaceholderPage.jsx'
import RayOnboardingPage from './features/onboarding/RayOnboardingPage.jsx'

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
              <PlaceholderPage
                title="Network Map"
                breadcrumbs={['Dashboard', 'Network Map']}
                description="Interactive Leaflet map with warehouse markers, store markers, route lines, risk overlays, and post-optimization shipment quantities. Coming in Phase 4."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <PlaceholderPage
                title="Inventory Management"
                breadcrumbs={['Dashboard', 'Inventory']}
                description="Searchable, filterable inventory table with expiry tracking, batch management, CSV import/export, and validated create/edit forms. Coming in Phase 4."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forecasting"
          element={
            <ProtectedRoute>
              <PlaceholderPage
                title="Demand Forecasting"
                breadcrumbs={['Dashboard', 'Forecasting']}
                description="Moving Average, Exponential Smoothing, Holt-Winters forecasting with MAE/WAPE evaluation and model comparison. Coming in Phase 5."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rescue"
          element={
            <ProtectedRoute>
              <PlaceholderPage
                title="Adaptive Inventory Rescue"
                breadcrumbs={['Dashboard', 'Inventory Rescue']}
                description="Guided 6-stage workflow: Select scenario → Configure → Optimize → Compare → Inspect → Approve. OR-Tools MILP engine. Coming in Phase 7."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/optimization"
          element={
            <ProtectedRoute>
              <PlaceholderPage
                title="Optimization Results"
                breadcrumbs={['Dashboard', 'Optimization']}
                description="Shipment recommendation table, before/after KPI comparison, route utilization, shortage analysis, and CSV export. Coming in Phase 6."
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scenarios"
          element={
            <ProtectedRoute>
              <PlaceholderPage
                title="Scenario History"
                breadcrumbs={['Dashboard', 'Scenarios']}
                description="Past scenarios with trigger type, solver result, cost comparison, approval state, and plan versioning. Coming in Phase 7."
              />
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

        {/* OAuth Callback route */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Default redirect */}
        <Route path="/" element={<RootRoute />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
