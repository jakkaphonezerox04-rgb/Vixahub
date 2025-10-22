import RouteGuard from "@/components/route-guard"
import UserDashboardLayout from "@/components/user-dashboard-layout"
import MyWebsitesPage from "@/components/my-websites-page"

export default function MyWebsitesPageRoute() {
  return (
    <RouteGuard requireAuth={true}>
      <UserDashboardLayout>
        <MyWebsitesPage />
      </UserDashboardLayout>
    </RouteGuard>
  )
}
