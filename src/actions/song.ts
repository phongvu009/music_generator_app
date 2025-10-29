"use server"

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/lib/auth"
import { revalidatePath } from "next/cache";

/**
 * Set the published status for a song owned by the current user.
 * Redirects to the sign-in page if there is no active session.
 *
 * @param songId - The ID of the song to update.
 * @param published - Whether the song should be published (true) or unpublished (false).
 */
export async function setPublishedStatus(songId: string, published: boolean) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) redirect("/auth/sign-in")

  await db.song.update({
    where: {
      id: songId,
      userId: session.user.id
    },
    data: {
      published
    }
  })
  // Refresh the /create page cache so the UI reflects the change immediately.
  revalidatePath("/create")
}

/**
 * Rename a song owned by the current user.
 * Will redirect to the sign-in page when there is no active session.
 *
 * @param songId - The ID of the song to rename.
 * @param newTitle - The new title to set for the song.
 */
export async function renameSong(songId: string, newTitle: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) redirect("/auth/sign-in");

  await db.song.update({
    where: {
      id: songId,
      userId: session.user.id,
    },
    data: {
      title: newTitle,
    }

  });

  // Refresh the /create page so the updated title appears in the UI.
  revalidatePath("/create")
}

/**
 * Toggle the like status for the current user on a song.
 * If the user already liked the song, the like is removed; otherwise a like is created.
 * Redirects to sign-in when there's no active session.
 *
 * @param songId - The ID of the song to like or unlike.
 */
export async function toggleLikeSong(songId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  // Fix: ensure redirect goes to the correct sign-in path.
  if (!session) redirect("/auth/sign-in")

  const existingLike = await db.like.findUnique({
    where: {
      userId_songId: {
        userId: session.user.id,
        songId
      }
    }
  })

  if (existingLike) {
    await db.like.delete({
      where: {
        userId_songId: {
          userId: session.user.id,
          songId
        }
      }
    })
  } else {
    await db.like.create({
      data: {
        userId: session.user.id,
        songId
      }
    })
  }

  // Revalidate the home path so like counts and UI update promptly.
  revalidatePath("/")

}
