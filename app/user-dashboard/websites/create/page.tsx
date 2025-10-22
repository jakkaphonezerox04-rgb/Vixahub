import RouteGuard from "@/components/route-guard"
import UserDashboardLayout from "@/components/user-dashboard-layout"
import CreateWebsitePage from "@/components/create-website-page"

export default function CreateWebsitePageRoute() {
  return (
    <RouteGuard requireAuth={true}>
      <UserDashboardLayout>
        <CreateWebsitePage />
      </UserDashboardLayout>
    </RouteGuard>
  )
}
