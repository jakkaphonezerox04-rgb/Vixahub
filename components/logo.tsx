import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  }

  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className={`${sizeClasses[size]} relative transition-transform duration-300 group-hover:scale-110`}>
        {/* SVG Logo */}
        <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E879F9" />
              <stop offset="50%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
            <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#E879F9" />
            </linearGradient>
            <linearGradient id="logoGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>

          {/* Main Crown/Shield Shape */}
          <g transform="translate(50,50)">
            {/* Center Diamond */}
            <polygon points="0,-15 12,0 0,15 -12,0" fill="white" className="animate-pulse" />

            {/* Top Triangle */}
            <polygon
              points="0,-35 -15,-15 15,-15"
              fill="url(#logoGradient1)"
              className="transition-all duration-300 group-hover:scale-105"
            />

            {/* Left Wing */}
            <polygon
              points="-35,-10 -15,-15 -15,5 -25,15"
              fill="url(#logoGradient2)"
              className="transition-all duration-300 group-hover:scale-105"
            />

            {/* Right Wing */}
            <polygon
              points="35,-10 15,-15 15,5 25,15"
              fill="url(#logoGradient2)"
              className="transition-all duration-300 group-hover:scale-105"
            />

            {/* Bottom Left */}
            <polygon
              points="-25,15 -12,0 -12,25 -20,30"
              fill="url(#logoGradient3)"
              className="transition-all duration-300 group-hover:scale-105"
            />

            {/* Bottom Right */}
            <polygon
              points="25,15 12,0 12,25 20,30"
              fill="url(#logoGradient3)"
              className="transition-all duration-300 group-hover:scale-105"
            />

            {/* Bottom Center */}
            <polygon
              points="0,15 -12,25 12,25"
              fill="url(#logoGradient1)"
              className="transition-all duration-300 group-hover:scale-105"
            />
          </g>
        </svg>
      </div>
      {showText && (
        <span
          className={`font-bold text-white ${textSizeClasses[size]} transition-colors duration-300 group-hover:text-purple-300`}
        >
          VIXAHUB
        </span>
      )}
    </Link>
  )
}
