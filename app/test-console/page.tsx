"use client"

import { useEffect, useState } from 'react'

export default function TestConsolePage() {
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    const results: string[] = []
    
    // Test console methods
    console.log('This should not appear in F12')
    console.info('This should not appear in F12')
    console.warn('This should not appear in F12')
    console.error('This should not appear in F12')
    console.debug('This should not appear in F12')
    
    // Test if console methods are overridden
    const logResult = console.log.toString()
    const infoResult = console.info.toString()
    
    results.push(`console.log is overridden: ${logResult.includes('function() {}') ? 'YES' : 'NO'}`)
    results.push(`console.info is overridden: ${infoResult.includes('function() {}') ? 'YES' : 'NO'}`)
    
    // Test window.console
    if (typeof window !== 'undefined') {
      const windowLogResult = window.console.log.toString()
      results.push(`window.console.log is overridden: ${windowLogResult.includes('function() {}') ? 'YES' : 'NO'}`)
    }
    
    setTestResults(results)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Console Disable Test</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <ul className="space-y-2">
            {testResults.map((result, index) => (
              <li key={index} className="text-green-400">
                {result}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Open F12 Developer Tools</li>
            <li>Go to Console tab</li>
            <li>Check if you can see any console.log messages</li>
            <li>All console methods should be disabled</li>
          </ol>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Manual Test:</h2>
          <p className="text-gray-300 mb-4">
            Try running these commands in the browser console:
          </p>
          <div className="bg-black p-4 rounded font-mono text-sm">
            <div>console.log('test')</div>
            <div>console.info('test')</div>
            <div>console.warn('test')</div>
            <div>console.error('test')</div>
          </div>
          <p className="text-gray-300 mt-4">
            None of these should produce any output in the console.
          </p>
        </div>
      </div>
    </div>
  )
}


