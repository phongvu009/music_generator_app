"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back()
        } else {
          router.push(fallback)
        }
      }}
      className="mb-4 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Back</span>
    </button>
  )
}
