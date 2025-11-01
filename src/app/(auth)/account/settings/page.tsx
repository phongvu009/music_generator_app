import { AccountView } from "@daveyplate/better-auth-ui"
import BackButton from "~/components/account/back-button"

export const metadata = {
  title: "Account Settings",
}

export default function AccountSettingsPage() {
  return (
    <main className="container p-6">
  <BackButton fallback="/" />
  <AccountView />
    </main>
  )
}
