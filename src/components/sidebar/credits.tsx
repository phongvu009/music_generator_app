"use server";

import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { db } from "~/server/db"

/**
 * A server component that displays the current user's remaining credits.
 * It fetches the session, then queries the database for the user's credit count.
 */
export default async function Credits() {
  // Retrieve the current user's session.
  // This requires headers, which are obtained using the `headers()` function from `next/headers`.
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // If there's no active session, the user is not logged in.
  // In this case, render nothing.
  if (!session) return null;

  // Fetch the user's data from the database using the user ID from the session.
  // We specifically select only the 'credits' field for performance.
  // `findUniqueOrThrow` will raise an error if the user isn't found,
  // which will be caught by Next.js's error boundary.
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { credits: true },
  })

  // Render the number of credits and a label.
  return (
    <>
      <p className="font-semibold">{user.credits}</p>
      <p className="text-muted-foreground">Credits</p>
    </>
  )
}
