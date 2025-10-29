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
/**
 * Request payload used when queuing a song generation.
 * All fields are optional; the server will pick the best available
 * title/metadata from the provided properties.
 */
export interface GenerateRequest {
  /** Free-form prompt guiding the model */
  prompt?: string;
  /** Raw lyrics provided by the user (may be partial) */
  lyrics?: string;
  /** Longer, fully described song text used to generate title/metadata */
  fullDescribedSong?: string;
  /** Short description of the lyrics used for title fallback */
  describedLyrics?: string;
  /** Whether the song should be instrumental (no vocals) */
  instrumental?: boolean;

}

/**
 * Main server action to generate a song. It authenticates the user,
 * then queues two song generation tasks with different guidance scales.
 * @param generateRequest The request object containing song generation parameters.
 */
/**
 * Server action that queues song generation jobs for the authenticated user.
 * It creates two queued jobs with different guidance scales to produce
 * varied results.
 *
 * Redirects to the sign-in page if there's no authenticated session.
 *
 * @param generateRequest - Parameters guiding the generation pipeline.
 */
export async function generateSong(generateRequest: GenerateRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect("/auth/sign-in");

  // Queue two variants so the user receives multiple generated results.
  await queueSong(generateRequest, 7.5, session.user.id)
  await queueSong(generateRequest, 15, session.user.id)

  // Refresh the /create page cache so newly queued songs appear in the UI.
  revalidatePath("/create")
}

/**
 * Queues a song for generation by creating a database record
 * and sending an event to Inngest.
 * @param generateRequest The request object containing song generation parameters.
 * @param guidanceScale The guidance scale for the generation model.
 * @param userId The ID of the user requesting the song.
 */
/**
 * Insert a song record into the database and send an event to the
 * background worker (Inngest) to process generation.
 *
 * @param generateRequest - Song generation parameters.
 * @param guidanceScale - Model guidance scale used during generation.
 * @param userId - Owner user id for the created song record.
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

/**
 * Retrieve a temporary, signed URL that allows the client to stream/play
 * the generated audio file from S3. Only the song owner or a published
 * song may be accessed.
 *
 * This function also increments the listen counter for analytics.
 *
 * @param songId - The ID of the song to fetch the play URL for.
 * @returns A presigned S3 URL valid for the configured expiry.
 */
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
  // Increment listen count to track plays.
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
/**
 * Create a presigned GET URL for an S3 object. The URL expires after 1 hour
 * by default and is used for streaming or temporary downloads.
 *
 * @param key - The S3 object key to sign.
 * @returns A signed URL string.
 */
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
