import { AuthLayout, SecondaryButton } from '../../components/AuthLayout'
import { signOutUser } from './actions'

/**
 * Reached when a Firebase Auth account exists (and is verified) but no
 * matching users/{uid} Firestore doc was ever created — e.g. an invite was
 * redeemed by someone else in the moment between this user's account
 * creation and their redemption transaction. Signing out and retrying (with
 * a fresh invite, if needed) is the only recovery, since Phase 1 has no
 * server-side code to clean up or retry on the user's behalf.
 */
export function AccountIncompletePage() {
  return (
    <AuthLayout title="Account setup didn't finish">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        You're signed in, but we couldn't find an account record for you. This usually happens
        if an invite link was used by someone else at the same moment, or a signup was
        interrupted partway through.
      </p>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        Sign out and ask the Owner for a fresh invite link.
      </p>
      <div className="mt-4">
        <SecondaryButton type="button" onClick={() => signOutUser()}>
          Sign out
        </SecondaryButton>
      </div>
    </AuthLayout>
  )
}
