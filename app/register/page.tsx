import RouteGuard from "@/components/route-guard"
import AuthLayout from "@/components/auth-layout"
import RegisterForm from "@/components/register-form"

export default function RegisterPage() {
  return (
    <RouteGuard requireAuth={false}>
      <AuthLayout>
        <RegisterForm />
      </AuthLayout>
    </RouteGuard>
  )
}
