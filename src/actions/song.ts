"use server"

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/lib/auth"
import { revalidatePath } from "next/cache";

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
  //refresh the page
  revalidatePath("/create")
}

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

  revalidatePath("/create")
}
