import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { ToastContainer } from '../ui/Toast.jsx'
import { useUIStore } from '../../store/index.js'
import NotificationDrawer from '../notifications/NotificationDrawer.jsx'
import GlobalSearchModal from '../search/GlobalSearchModal.jsx'
import UserProfileModal from '../../features/profile/UserProfileModal.jsx'

export function AppLayout({ children, pageTitle, breadcrumbs }) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="ss-layout">
      <Sidebar />

      <div
        className={`ss-main-content ${sidebarCollapsed ? 'ss-main-content-collapsed' : ''}`}
      >
        <Topbar pageTitle={pageTitle} breadcrumbs={breadcrumbs} />

        <main className="ss-page-content" id="main-content">
          {children}
        </main>
      </div>

      {/* Global Realtime Overlays */}
      <NotificationDrawer />
      <GlobalSearchModal />
      <UserProfileModal />
      <ToastContainer />
    </div>
  )
}
