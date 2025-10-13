
// Import 'headers' to access request headers on the server. This is needed
// by the auth library to read the session cookie.
import { headers } from "next/headers";
import Link from "next/link";
// Import the initialized 'better-auth' instance.
import { auth } from "~/lib/auth";
// Import the 'redirect' function for server-side navigation.
import { redirect } from "next/navigation";
import CreateSong from "~/components/create"


// This is an async Server Component, allowing us to use 'await' for data fetching.
export default async function HomePage() {
  // Fetch the user's session from the server-side auth API.
  // We pass the request headers so it can access the session cookie.
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // This is the authentication guard. If there is no session, the user is not logged in.
  if (!session) {
    // Redirect the unauthenticated user to the sign-in page.
    redirect("/auth/sign-in")
  }

  // If the user is authenticated, render the main dashboard content.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <p>Dashboard</p>
      <CreateSong />
    </main>
  )
}
