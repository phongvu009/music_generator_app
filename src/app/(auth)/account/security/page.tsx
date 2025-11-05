import { headers } from "next/headers"
import { SecuritySettingsCards } from "@daveyplate/better-auth-ui"
import BackButton from "~/components/account/back-button"
import { auth } from "~/lib/auth"
import { redirect } from "next/navigation"

export default async function SecuritySettings() {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        redirect("/auth/sign-in")
    } 
    return (
        <div className="container mx-auto p-6">
            <BackButton fallback="/account/settings" />
            <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
            <SecuritySettingsCards />
        </div>
    )
}
