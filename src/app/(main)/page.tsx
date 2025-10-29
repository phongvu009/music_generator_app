
// Import 'headers' to access request headers on the server. This is needed
// by the auth library to read the session cookie.
import { headers } from "next/headers";
import Link from "next/link";
// Import the initialized 'better-auth' instance.
import { auth } from "~/lib/auth";
// Import the 'redirect' function for server-side navigation.
import { redirect } from "next/navigation";
import CreateSong from "~/components/create"
import { getPresignedUrl } from "~/actions/generation";
// Import the Prisma/DB client for server-side database queries.
import { db } from "~/server/db";

import { Music } from "lucide-react"
import { SongCard } from "~/components/home/song-card";


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

  // List songs (server-side) to populate the dashboard.
  // We can optionally use `userId` to scope queries to the current user.
  const userId = session?.user.id

  // Query published songs from the database. Adjust the `where` clause
  // to filter by `userId` if you want only the current user's songs.
  const songs = await db.song.findMany({
    where: {
      published: true,
    },
    include: {
      user: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          likes: true
        }
      },
      categories: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  console.log("songs from db:", songs)

  // For each song that has an S3 key for its thumbnail, fetch a
  // presigned URL so the client can load the image directly from S3.
  // Use Promise.all to run these requests in parallel.
  const songsWithUrls = await Promise.all(
    songs.map(async (song) => {
      const thumbnailUrl = song.thumbnailS3Key
        ? await getPresignedUrl(song.thumbnailS3Key)
        : null

      return { ...song, thumbnailUrl }
    })
  )

  // Compute a simple 'trending' list: songs created within the last
  // two days. Note: use the `createdAt` field from the DB model.
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const trendingSongs = songsWithUrls
    .filter((song) => song.createdAt <= twoDaysAgo)
    .slice(0, 10)

  const trendingSongIds = new Set(trendingSongs.map((song) => song.id))

  //list songs by Category 
  const categorizedSongs = songsWithUrls
    .filter((song) => !trendingSongIds.has(song.id) && song.categories.length > 0)
    .reduce((acc, song) => {
      const primaryCategory = song.categories[0]
      if (primaryCategory) {
        if (!acc[primaryCategory.name]) {
          acc[primaryCategory.name] = []
        }
        if (acc[primaryCategory.name]!.length < 10) {
          acc[primaryCategory.name]!.push(song)
        }
      }
      return acc

    }, {} as Record<string, Array<(typeof songsWithUrls)[number]>>,)

  // if (trendingSongs.length === 0 && Object.keys(categorizedSongs).length === 0) {

  if (false) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <Music className="text-muted-foreground h-20 w-20" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          No Music Here
        </h1>
        <p className="text-muted-foreground">
          There are no publishedd songs available right now
        </p>
      </div>
    )
  }


  // If the user is authenticated, render the main dashboard content.
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold tracking-tight">
        Discover Music
      </h1>

      {/* Treding Songs */}
      {trendingSongs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold"> Treding</h2>
          <div className="mt-4 grid grid_cols-2 gap-x-4 gap-x-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ">
            {trendingSongs.map((song) => (
              <SongCard key={song.id} song={song} />

            ))}
          </div>
        </div>
      )}
    </div>
  )
}
