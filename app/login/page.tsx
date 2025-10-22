import RouteGuard from "@/components/route-guard"
import AuthLayout from "@/components/auth-layout"
import LoginForm from "@/components/login-form"

export default function LoginPage() {
  return (
    <RouteGuard requireAuth={false}>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </RouteGuard>
  )
}
