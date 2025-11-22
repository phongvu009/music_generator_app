"use client"

import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { authClient } from "~/lib/auth-client"
import BackButton from "~/components/account/back-button"

export default function CustomerPortalRedirect() {
  useEffect(() => {
    const portal = async () => {
      await authClient.customer.portal()

    }

    portal()
  }, [])

  return (
    <div className="relative flex h-screen w-full items-center justify-center">
      <div className="absolute left-4 top-4">
        <BackButton fallback="/" />
      </div>

      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-muted-foreground">Loading Customer Portal ....</span>

      </div>
    </div>
  )

}
