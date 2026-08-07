import { Link } from 'react-router-dom'

const sections = [
  {
    to: '/control-center/invites',
    title: 'Invite Management',
    description: 'Create and track invite links. Registration is invite-only.',
  },
  {
    to: '/control-center/users',
    title: 'User Management',
    description: 'See everyone with access and enable or disable a user.',
  },
  {
    to: '/control-center/system',
    title: 'Database & System Info',
    description: 'User/invite counts, project details, and Firebase Console links.',
  },
  {
    to: '/control-center/backup',
    title: 'Backup Management',
    description: 'Download a JSON export of your users and invites.',
  },
  {
    to: '/control-center/settings',
    title: 'App & Security Settings',
    description: 'App name, default invite expiration, and the security model.',
  },
]

export function ControlCenterHome() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Control Center</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Owner-only tools for managing this ForecastFlow instance.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="rounded-lg border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-800 dark:hover:border-indigo-800 dark:hover:bg-indigo-950"
          >
            <h2 className="font-medium text-slate-900 dark:text-slate-100">{section.title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
