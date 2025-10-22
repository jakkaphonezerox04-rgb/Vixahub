import ContactSection from "@/components/contact-section"
import SharedHeader from "@/components/shared-header"

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-black to-blue-950">
      <SharedHeader />
      <main>
        <ContactSection />
      </main>
    </div>
  )
}
