import RouteGuard from "@/components/route-guard"
import UserDashboardLayout from "@/components/user-dashboard-layout"
import SettingsPage from "@/components/settings-page"

export default function UserSettingsPage() {
  return (
    <RouteGuard requireAuth={true}>
      <UserDashboardLayout>
        <SettingsPage />
      </UserDashboardLayout>
    </RouteGuard>
  )
}
