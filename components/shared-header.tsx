"use client"
import Link from "next/link"
import Logo from "./logo"

export default function SharedHeader() {
  return (
    <header className="relative z-10 px-6 py-4 mx-auto max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-left">
          <Logo size="md" showText={true} />
          <nav className="hidden ml-12 space-x-8 md:flex">
            {[
              { name: "Home", href: "/" },
              { name: "Price", href: "/pricing" },
              { name: "Contact", href: "/contact" },
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="px-4 py-2 text-white hover:text-gray-200 transition-all duration-300 hover:scale-105 hover:bg-white/10 rounded-xl"
          >
            Log In
          </Link>
        </div>
      </div>
    </header>
  )
}


