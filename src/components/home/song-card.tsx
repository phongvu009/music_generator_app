"use client"
import type { Category,Like, Song } from "@prisma/client"
import { useState } from "react"
import { getPlayUrl } from "~/actions/generation"
import { usePlayerStore } from "~/stores/use-player-store"

import { Music, Loader2, Play, Heart } from "lucide-react"
import { toggleLikeSong } from "~/actions/song"

/**
 * Extended Song type including the relations used by this component.
 * - user: the creator (we only read `name` here)
 * - _count: aggregated counts such as likes
 * - categories: the song's categories/tags
 * - thumbnailUrl: optional artwork URL shown in the player
 */
type SongWithRelation = Song & {
  user: { name: string | null };
  _count: {
    likes: number;
  }
  categories: Category[];
  thumbnailUrl?: string | null;
  likes? : Like[]
}


/**
 * SongCard
 * A small UI piece that represents a generated song. It wires up the
 * play action to the global player store and resolves a play URL
 * via the `getPlayUrl` action.
 *
 * Props:
 * - song: SongWithRelation — song data and related fields used for display/playback
 *
 * Behavior/side-effects:
 * - When the user triggers play, we fetch the streaming URL and call `setTrack` on
 *   the player store to start playback.
 */
export function SongCard({ song }: { song: SongWithRelation }) {
  // Local loading state while we fetch the play URL.
  const [isLoading, setIsLoading] = useState(false)
  //Track likes 
  const [isLiked, setIsLiked] = useState(song.likes ? song.likes.length > 0 : false)
  const [likesCount, setLikesCount] = useState(song._count.likes)

  // Get the setter from the player store. `setTrack` expects an object with
  // id, title, url, artwork, prompt and createdByUserName which the player will use.
  const setTrack = usePlayerStore((state) => state.setTrack)

  /**
   * handlePlay
   * 1) set local loading state
   * 2) call backend action `getPlayUrl` with the song id to resolve a stream URL
   * 3) call `setTrack` to update the global player state (no auto-play logic here)
   *
   * Notes/edge-cases:
   * - We don't currently catch network errors here; the caller could show a toast.
   * - `isLoading` is kept minimal for UI feedback; the caller component can expand it.
   */
  const handlePlay = async () => {
    setIsLoading(true)

    const playUrl = await getPlayUrl(song.id)

    // Update the global player with the resolved track info. The player store
    // is responsible for starting playback and persisting the play queue.
    setTrack({
      id: song.id,
      title: song.title,
      url: playUrl,
      artwork: song.thumbnailUrl,
      prompt: song.prompt,
      createdByUserName: song.user.name

    })

    setIsLoading(false);
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    //change like state
    setIsLiked(!isLiked)
    //change count 
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)

    //update database: add/remove like
    await toggleLikeSong(song.id)

  }

  // The UI here is intentionally minimal — this component focuses on behavior.
  return (
    <div>
      <div onClick={handlePlay} className="cursor-pointer">
        <div className="group relative aspect-square w-full overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75">
          {song.thumbnailUrl
            ? (<img className="h-full w-full object-cover object-center" src={song.thumbnailUrl} />)
            : (< div className="bg-muted flex h-full w-full items-center justify-center">
              <Music className="text-muted-foreground h-12 w-12" /> </div>)}

          {/* Loader */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 transition-transform group-hover:scale-105">
              {isLoading
                ? (<Loader2 className="h-6 w-6 animate-spin text-white" />)
                : (<Play className="h-6 w-6 fill-white text-white" />)}
            </div>
          </div>
        </div>

        <h3 className="mt-2 truncate text-sm font-medium text-gray-900">{song.title}</h3>
        <p className="text-xs text-gray-500">{song.user.name}</p>

        <div className="mt-1 flex items-center justify-between text-xs text-gray-900">
          <span>{song.listenCount} listens</span>
          <button onClick={handleLike} className="flex cursor-pointer items-center gap-1">
            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
            {likesCount} likes
          </button>
        </div>

      </div>


    </div >
  )

}
