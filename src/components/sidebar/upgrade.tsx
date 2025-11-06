"use client"
import { Button } from "../ui/button"
import { authClient } from "~/lib/auth-client"
import { POLAR_PRODUCTS } from "~/lib/constants"

export default function Upgrade() {
  const upgrade = async () => {
    try {
      await authClient.checkout({
        products: [
          POLAR_PRODUCTS.SMALL.id,
          POLAR_PRODUCTS.MEDIUM.id,
          POLAR_PRODUCTS.LARGE.id,
        ],
      })
    } catch (err) {
      // Log client-side error for diagnostics
      // eslint-disable-next-line no-console
      console.error("Checkout failed:", err)
    }
  }
  return (
    <Button
      onClick={upgrade}
      variant="outline"
      size="sm"
      className="ml-2 cursor-pointer text-orange-400"
    >
      Upgrade
    </Button>
  )
}
