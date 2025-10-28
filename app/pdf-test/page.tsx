'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function PDFTestPage() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<{
    test: string
    result: any
    status?: any
    timestamp: string
  }[]>([])

  const testPDFPerformance = async () => {
    setTesting(true)
    const newResults: {
      test: string
      result: any
      status?: any
      timestamp: string
    }[] = []

    try {
      // Test 1: Check browser status
      const statusResponse = await fetch('/api/pdf-status')
      const statusData = await statusResponse.json()
      newResults.push({
        test: 'Browser Status Check',
        result: statusData.browserStatus,
        timestamp: new Date().toLocaleTimeString()
      })

      // Test 2: Initialize browser if needed
      const initResponse = await fetch('/api/pdf-status', { method: 'POST' })
      const initData = await initResponse.json()
      newResults.push({
        test: 'Browser Initialization',
        result: `${initData.duration}ms`,
        status: initData.browserStatus,
        timestamp: new Date().toLocaleTimeString()
      })

      setResults(newResults)
    } catch (error) {
      newResults.push({
        test: 'Error',
        result: error,
        timestamp: new Date().toLocaleTimeString()
      })
      setResults(newResults)
    } finally {
      setTesting(false)
    }
  }

  const downloadTestPDF = async () => {
    try {
      const start = Date.now()
      // Use a sample invoice ID - replace with actual ID from your system
      const response = await fetch('/api/invoices/8f70842f-9ae9-42f9-8efd-cac9bc00c056/pdf')
      const duration = Date.now() - start
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'test-invoice.pdf'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        const newResults = [...results]
        newResults.push({
          test: 'PDF Download',
          result: `${duration}ms - Success!`,
          timestamp: new Date().toLocaleTimeString()
        })
        setResults(newResults)
      }
    } catch (error) {
      const newResults = [...results]
      newResults.push({
        test: 'PDF Download',
        result: `Error: ${error}`,
        timestamp: new Date().toLocaleTimeString()
      })
      setResults(newResults)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">⚡ PDF Performance Test</h1>
      
      <div className="space-y-4 mb-8">
        <Button 
          onClick={testPDFPerformance}
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing Browser...' : '🔍 Check Browser Status & Initialize'}
        </Button>
        
        <Button 
          onClick={downloadTestPDF}
          className="w-full"
          variant="secondary"
        >
          🚀 Download Test PDF (Measure Speed)
        </Button>
      </div>

      {results.length > 0 && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{result.test}</h3>
                    <p className="text-gray-600 mt-1">
                      {typeof result.result === 'object' 
                        ? JSON.stringify(result.result, null, 2)
                        : result.result
                      }
                    </p>
                    {result.status && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-blue-600">
                          Browser Status Details
                        </summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.status, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{result.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">📈 Expected Performance</h2>
        <ul className="space-y-2 text-sm">
          <li><strong>First PDF (Cold Start):</strong> 2-5 seconds (browser launch + generation)</li>
          <li><strong>Subsequent PDFs:</strong> 200-500ms (browser reuse)</li>
          <li><strong>Cached PDFs:</strong> &lt;50ms (instant cache hit)</li>
          <li><strong>Browser Pool:</strong> 5 pre-initialized pages ready</li>
          <li><strong>Cache TTL:</strong> 10 minutes for instant re-downloads</li>
        </ul>
      </div>
    </div>
  )
}