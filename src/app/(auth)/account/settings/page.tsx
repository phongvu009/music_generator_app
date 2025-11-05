import { headers } from "next/headers"
import { AccountView } from "@daveyplate/better-auth-ui"
import BackButton from "~/components/account/back-button"
import { auth } from "~/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Account Settings",
}

export default async function AccountSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/auth/sign-in")
  }

  return (
    <main className="container p-6">
      <BackButton fallback="/" />
      <AccountView />
    </main>
  )
}

