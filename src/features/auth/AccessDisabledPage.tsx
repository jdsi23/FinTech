import { AuthLayout, SecondaryButton } from '../../components/AuthLayout'
import { signOutUser } from './actions'

/** Reached when the Owner has toggled disabled=true on this user's doc via
 * Control Center -> User Management (see firestore.rules for the owner-only
 * update rule). The underlying Firebase Auth account still exists — there's
 * no way to delete another user's account from the client — this screen is
 * the only enforcement, alongside the route guard in AppRoutes.tsx. */
export function AccessDisabledPage() {
  return (
    <AuthLayout title="Access disabled">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        The Owner has disabled your access to ForecastFlow. If you believe this is a mistake, reach
        out to them directly.
      </p>
      <div className="mt-4">
        <SecondaryButton type="button" onClick={() => signOutUser()}>
          Sign out
        </SecondaryButton>
      </div>
    </AuthLayout>
  )
}
