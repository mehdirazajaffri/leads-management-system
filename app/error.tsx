'use client'

import { useEffect } from 'react'
import DatabaseUnavailable from '@/components/features/DatabaseUnavailable'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  const message = error?.message || ''
  const looksLikeDbDown =
    message.includes("Can't reach database server") ||
    message.includes('Connection terminated due to connection timeout') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT')

  if (looksLikeDbDown) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            <DatabaseUnavailable details={message} />
            <button
              onClick={() => reset()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <pre className="mt-3 p-3 bg-gray-50 text-xs overflow-auto">{message}</pre>
          <button
            onClick={() => reset()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  )
}


