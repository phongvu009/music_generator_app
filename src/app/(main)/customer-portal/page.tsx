import { auth } from "~/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import CustomerPortalRedirect from "~/components/customer-portal-redirect"

export default async function CustomerPortalPate() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/auth/sign-in")
  }

  return <CustomerPortalRedirect />

}
