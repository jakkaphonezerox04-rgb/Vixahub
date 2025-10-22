import RouteGuard from "@/components/route-guard"
import UserDashboardLayout from "@/components/user-dashboard-layout"
import UserProfileDashboard from "@/components/user-profile-dashboard"

export default function UserDashboardPage() {
  return (
    <RouteGuard requireAuth={true}>
      <UserDashboardLayout>
        <UserProfileDashboard />
      </UserDashboardLayout>
    </RouteGuard>
  )
}
