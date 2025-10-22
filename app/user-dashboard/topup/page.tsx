import RouteGuard from "@/components/route-guard"
import UserDashboardLayout from "@/components/user-dashboard-layout"
import TopupPage from "@/components/topup-page"

export default function UserTopupPage() {
  return (
    <RouteGuard requireAuth={true}>
      <UserDashboardLayout>
        <TopupPage />
      </UserDashboardLayout>
    </RouteGuard>
  )
}
