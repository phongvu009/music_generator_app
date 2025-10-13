import { inngest } from "./client";
import { db } from "~/server/db";
import { env } from "~/env";

// This defines and exports an Inngest function. Inngest is used for running reliable background jobs.
export const generateSong = inngest.createFunction(
  // The first argument is the function configuration.
  // 'id' is a unique identifier for this function.
  {
    id: "generate-song",
    concurrency: {
      limit: 1,
      key: "event.data.userId"
    },
    onFailure: async ({ event, error }) => {
      await db.song.update({
        where: {
          id: event?.data?.event?.data?.songId,
        },
        data: {
          status: "failed"
        }
      })
    }
  },
  // The second argument defines the trigger for the function.
  // In this case, it's an event named "generate-song-event".
  { event: "generate-song-event" },
  // The third argument is the function handler, which contains the logic to be executed.
  // It receives the 'event' payload and a 'step' utility to define resumable steps.
  async ({ event, step }) => {

    // Destructures 'songId' from the event data. The event payload is expected
    // to contain both a 'songId' and a 'userId'.
    const { songId } = event.data as {
      songId: string;
      userId: string;
    }

    // Defines a step within the function named "check-credits".
    // Steps in Inngest are idempotent and resumable, which is useful for long-running tasks.
    const { userId, credits, endpoint, body } = await step.run("check-credits", async () => {
      // Fetches the song details from the database using its ID.
      // It uses 'findUniqueOrThrow' which will throw an error if the song is not found.
      const song = await db.song.findUniqueOrThrow({
        where: {
          id: songId
        },
        // Selects specific fields from the 'song' table and its related 'user' table.
        select: {
          user: {
            select: {
              id: true,
              credits: true // User's available credits.
            }
          },
          prompt: true, // The user's text prompt for the song.
          lyrics: true, // The lyrics for the song.
          fullDescribedSong: true, // A more detailed description of the song.
          describedLyrics: true, // A more detailed description of the lyrics.
          instrumental: true, // Flag for whether the song is instrumental.
          guidanceScale: true, // A parameter for the generation model.
          inferStep: true, // A parameter for the generation model.
          audioDuration: true, // The desired duration of the audio.
          seed: true, // A seed for reproducibility.
        },
      });

      // Defines the type for the request body that will likely be sent to an
      // external music generation API.
      type RequestBody = {
        guidance_scale?: number;
        infer_step?: number;
        audio_duration?: number;
        instrumental?: boolean;
        seed?: number;
        full_described_song?: string;
        prompt?: string;
        lyrics?: string;
        described_lyrics?: string;
      }

      // Initializes an empty object for the request body.
      // This will be populated with the song generation parameters.
      let endpoint = "";
      let body: RequestBody = {};

      // Creates an object with common parameters for the music generation API call.
      // It uses the nullish coalescing operator (??) to provide 'undefined' if a value is null,
      // which helps in sending a cleaner request body without null values.
      const commonParams = {
        guidance_scale: song.guidanceScale ?? undefined,
        infer_step: song.inferStep ?? undefined,
        audio_duration: song.audioDuration ?? undefined,
        instrumental: song.instrumental ?? undefined,
        seed: song.seed ?? undefined,
      }
      // The rest of the logic for this step would continue here, such as checking credits,
      // calling the music generation API, and updating the song status in the database.

      //User provide Description of a song
      if (song.fullDescribedSong) {
        endpoint = env.GENERATE_FROM_DESCRIPTION;
        body = {
          full_described_song: song.fullDescribedSong,
          ...commonParams,
        }
      }

      //Custom Mode : lyrics + prompt
      else if (song.lyrics && song.prompt) {
        endpoint = env.GENERATE_FROM_DESCRIBED_LYRICS;
        body = {
          lyrics: song.lyrics,
          prompt: song.prompt,
          ...commonParams,
        }
      }

      //Custom Mode: described lyrics + prompt
      else if (song.describedLyrics && song.prompt) {

        endpoint = env.GENERATE_FROM_DESCRIBED_LYRICS;
        body = {
          described_lyrics: song.describedLyrics,
          prompt: song.prompt,
          ...commonParams,
        }
      }

      return {
        userId: song.user.id,
        credits: song.user.credits,
        endpoint: endpoint,
        body: body,
      }
    })

    //check credit 
    if (credits > 0) {
      // generate song
      await step.run("set-status-processing", async () => {
        return await db.song.update({
          where: {
            id: songId,
          },
          data: {
            status: "processing"
          }
        })
      })

      const response = await step.fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Model-Key": env.MODAL_KEY,
          "Model-Secret": env.MODAL_SECRET,
        }
      })
      //update database when having data
      await step.run("update-song-result", async () => {
        const responseData = response.ok
          ? ((await response.json()) as {
            s3_key: string;
            cover_image_s3_key: string;
            categories: string[]
          }) : null;

        await db.song.update({
          where: {
            id: songId
          },
          data: {
            s3Key: responseData?.s3_key,
            thumbnailS3Key: responseData?.cover_image_s3_key,
            status: response.ok ? "processed" : "failed"
          }
        })

        if (responseData && responseData.categories.length > 0) {
          await db.song.update({
            where: { id: songId },
            data: {
              categories: {
                connectOrCreate: responseData.categories.map(
                  (categoryName) => ({
                    where: { name: categoryName },
                    create: { name: categoryName }
                  })
                )
              }
            }
          })
        }
      })

      //reduce credit
      return await step.run("deduct-credits", async () => {
        if (!response.ok) return;

        return await db.user.update({
          where: { id: userId },
          data: {
            credits: {
              decrement: 1,
            }
          }
        })
      })

    } else {
      // set status "not enough credit"
      await step.run("set-status-no-credits", async () => {
        return await db.song.update({
          where: {
            id: songId,
          },
          data: {
            status: "no credits"
          }
        })
      })
    }
  },
);

