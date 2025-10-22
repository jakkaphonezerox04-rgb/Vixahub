"use client"

import { useEffect } from 'react'
import { disableConsoleCompletely } from '@/lib/disable-console'

/**
 * Component to disable console logs on client-side
 * This ensures console is disabled even after page loads
 */
export default function ConsoleDisabler() {
  useEffect(() => {
    // Only disable console in production
    if (process.env.NODE_ENV === 'production') {
      try {
        // Disable console logs immediately when component mounts
        disableConsoleCompletely()
        
        // Also disable console on window load to catch any late console calls
        const handleLoad = () => {
          disableConsoleCompletely()
        }
        
        window.addEventListener('load', handleLoad)
        
        // Cleanup
        return () => {
          window.removeEventListener('load', handleLoad)
        }
      } catch (error) {
        // Silently fail if console disabling doesn't work
        console.warn('Failed to disable console:', error)
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}


