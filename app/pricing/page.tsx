import PricingSection from "@/components/pricing-section"
import SharedHeader from "@/components/shared-header"

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-black to-blue-950">
      <SharedHeader />
      <main>
        <PricingSection />
      </main>
    </div>
  )
}
