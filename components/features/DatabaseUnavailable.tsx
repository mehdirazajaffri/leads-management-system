'use client'

export default function DatabaseUnavailable({
  title = 'Database unavailable',
  details,
}: {
  title?: string
  details?: string
}) {
  const isPrismaAccelerate = details?.includes('db.prisma.io')
  
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-red-200 dark:bg-gray-900 dark:border-red-800">
      <h2 className="text-xl font-bold text-red-700 dark:text-red-400">{title}</h2>
      <p className="mt-2 text-gray-700 dark:text-gray-300">
        The app can't reach your PostgreSQL server. This is why Prisma calls are failing.
      </p>
      {details ? (
        <pre className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 text-xs overflow-auto rounded border border-gray-200 dark:border-gray-700">
          {details}
        </pre>
      ) : null}
      <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
        {isPrismaAccelerate ? (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Prisma Accelerate Database Detected
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Check if your Prisma Accelerate database is paused (free tier databases pause after inactivity)</li>
              <li>Visit your Prisma dashboard to resume the database</li>
              <li>Verify your connection string in the Prisma dashboard</li>
              <li>Check if your IP is whitelisted (if IP restrictions are enabled)</li>
            </ul>
          </div>
        ) : (
          <div>
            <p className="mb-2">
              Fix by updating <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">DATABASE_URL</code> in your <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">.env</code> file.
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Common causes:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-500 dark:text-gray-400">
              <li>Wrong host or port in DATABASE_URL</li>
              <li>VPN/firewall blocking port 5432</li>
              <li>Database server is down or paused</li>
              <li>Incorrect credentials</li>
              <li>Missing SSL parameters (add <code className="font-mono">?sslmode=require</code> if needed)</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>
        )}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <p className="font-semibold mb-1">Quick Checks:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>Verify DATABASE_URL in your <code className="font-mono">.env</code> file</li>
            <li>Test connection: <code className="font-mono">psql $DATABASE_URL</code></li>
            <li>Check database server status</li>
            <li>Review firewall/network settings</li>
            <li>Restart the development server after changing .env</li>
          </ol>
        </div>
      </div>
    </div>
  )
}


