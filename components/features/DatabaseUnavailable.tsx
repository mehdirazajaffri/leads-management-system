'use client'

export default function DatabaseUnavailable({
  title = 'Database unavailable',
  details,
}: {
  title?: string
  details?: string
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-red-200">
      <h2 className="text-xl font-bold text-red-700">{title}</h2>
      <p className="mt-2 text-gray-700">
        The app can’t reach your PostgreSQL server. This is why Prisma calls are failing.
      </p>
      {details ? <pre className="mt-3 p-3 bg-gray-50 text-xs overflow-auto">{details}</pre> : null}
      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <p>
          Fix by updating <code className="font-mono">DATABASE_URL</code> in your <code className="font-mono">.env</code>{' '}
          to a reachable Postgres.
        </p>
        <p className="text-gray-500">
          Common causes: wrong host, VPN/firewall blocking port 5432, database paused/sleeping, wrong credentials, missing
          SSL params.
        </p>
      </div>
    </div>
  )
}


