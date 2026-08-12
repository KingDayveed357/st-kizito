import { LoginForm } from "./login-form"

/**
 * Admin sign-in. Deliberately lives OUTSIDE the `(dashboard)` route group so it never renders the
 * dashboard shell (sidebar/navbar).
 *
 * This is a server component: search params arrive as props and are handed to the client form, so
 * the form is server-rendered. Reading them with `useSearchParams()` instead would trigger a
 * client-side-rendering bailout, requiring a Suspense boundary and showing a spinner before the form.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; loggedOut?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <LoginForm
      nextPath={params.next ?? "/admin"}
      loggedOut={params.loggedOut === "1"}
      notAuthorized={params.error === "not_authorized"}
    />
  )
}
