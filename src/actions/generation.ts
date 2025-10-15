"use server"
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import { auth } from "~/lib/auth"
import { inngest } from "~/inngest/client"
import { revalidatePath } from "next/cache";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "~/env"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * Defines the structure for a song generation request.
 */
export interface GenerateRequest {
  prompt?: string;
  lyrics?: string;
  fullDescribedSong?: string;
  describedLyrics?: string;
  instrumental?: boolean;

}

/**
 * Main server action to generate a song. It authenticates the user,
 * then queues two song generation tasks with different guidance scales.
 * @param generateRequest The request object containing song generation parameters.
 */
export async function generateSong(generateRequest: GenerateRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect("/auth/sign-in");

  await queueSong(generateRequest, 7.5, session.user.id)
  await queueSong(generateRequest, 15, session.user.id)

  // Revalidate the '/create' page path to reflect the newly queued songs in the UI.
  //to refresh cached data for a specific route or page.
  //when the user visits or reloads that page, it fetches fresh data from the database or API.
  //After queueing new songs, ensure /create shows them
  revalidatePath("/create")
}

/**
 * Queues a song for generation by creating a database record
 * and sending an event to Inngest.
 * @param generateRequest The request object containing song generation parameters.
 * @param guidanceScale The guidance scale for the generation model.
 * @param userId The ID of the user requesting the song.
 */
export async function queueSong(
  generateRequest: GenerateRequest,
  guidanceScale: number,
  userId: string
) {
  // Determine the song's title. It defaults to "Untitled" and is then
  // overridden by different properties from the request, with the last one taking precedence.
  let title = "Untitled"
  // If lyrics were described (simple mode), use that for the title.
  if (generateRequest.describedLyrics) title = generateRequest.describedLyrics
  // If a full song was described, use that for the title as it's more specific.
  if (generateRequest.fullDescribedSong) title = generateRequest.fullDescribedSong

  // Capitalize the first letter of the title for consistent formatting.
  title = title.charAt(0).toUpperCase() + title.slice(1)

  const song = await db.song.create({
    data: {
      userId: userId,
      title: title,
      prompt: generateRequest.prompt,
      lyrics: generateRequest.lyrics,
      describedLyrics: generateRequest.describedLyrics,
      fullDescribedSong: generateRequest.fullDescribedSong,
      instrumental: generateRequest.instrumental,
      guidanceScale: guidanceScale,
      audioDuration: 180
    }
  })

  // Send an event to Inngest to process the song generation.
  await inngest.send({
    name: "generate-song-event",
    data: { songId: song.id, userId: song.userId }
  })


}

export async function getPlayUrl(songId: string) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) redirect("/auth/sign-in")

  const song = await db.song.findUniqueOrThrow({
    where: {
      id: songId,
      OR: [{ userId: session.user.id }, { published: true }],
      s3Key: {
        not: null
      },
    },
    select: {
      s3Key: true,
    }
  })
  //update database
  await db.song.update({
    where: {
      id: songId
    },
    data: {
      listenCount: {
        increment: 1,
      }
    }
  })

  return await getPresignedUrl(song.s3Key!)


}

//get data fromaws s3 bucket
export async function getPresignedUrl(key: string) {
  const s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY_ID,
    }
  })

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, {
    expiresIn: 3600
  })
}
