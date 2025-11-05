import { SecuritySettingsCards } from "@daveyplate/better-auth-ui"
import BackButton from "~/components/account/back-button"

export function SecuritySettings() {
    return (
        <div className="container mx-auto p-6">
            <BackButton fallback="/account/settings" />
            <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
            <SecuritySettingsCards />
        </div>
    )
}

export default SecuritySettings