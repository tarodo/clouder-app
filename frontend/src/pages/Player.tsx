import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  ChevronsLeft,
  ChevronsRight,
  PauseCircle,
  PlayCircle,
} from "lucide-react"
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer"
import { formatMsToTime } from "@/lib/utils"

interface ClouderWeekResponse {
  clouder_week: string
}

interface SpPlaylist {
  playlist_id: string
  clouder_pl_name: string
  clouder_pl_type: "base" | "category"
  clouder_week: string
  playlist_name: string
}

export default function PlayerPage() {
  const {
    track,
    loading,
    error,
    handlePrevious,
    handleNext,
    handlePlayPause,
    handleSeek,
    handleRewind,
    handleFastForward,
  } = useSpotifyPlayer()

  const [categoryPlaylists, setCategoryPlaylists] = useState<{ name: string; playlist_id: string }[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const categoryCache = useRef<{ [playlistId: string]: { week: string, categories: { name: string; playlist_id: string }[] } }>({})

  const handleMoveTrack = async (targetPlaylistId: string, sourcePlaylistId: string, trashPlaylistId: string) => {
    if (!track?.item) return
    try {
      const sp_token = localStorage.getItem('spotify_access_token')
      await fetch(
        `http://127.0.0.1:8000/clouder_playlists/move_track?sp_token=${sp_token}`,
        { method: "POST", body: JSON.stringify({ track_id: track.item.id, source_playlist_id: sourcePlaylistId, target_playlist_id: targetPlaylistId, trash_playlist_id: trashPlaylistId }) }
      )
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const fetchCategoryPlaylists = async () => {
      if (!track?.context || track.context.type !== "playlist") {
        setCategoryPlaylists([])
        return
      }

      const playlistId = track.context.uri.split(":")[2]
      if (!playlistId) {
        setCategoryPlaylists([])
        return
      }

      if (categoryCache.current[playlistId]) {
        setCategoryPlaylists(categoryCache.current[playlistId].categories)
        return
      }

      setCategoriesLoading(true)
      setCategoriesError(null)
      setCategoryPlaylists([])

      try {
        const weekResponse = await fetch(
          `http://127.0.0.1:8000/clouder_playlists/${playlistId}/clouder_week`
        )
        if (!weekResponse.ok) {
          throw new Error("Failed to fetch clouder week")
        }
        const weekData: ClouderWeekResponse = await weekResponse.json()
        const clouderWeek = weekData.clouder_week

        if (!clouderWeek) {
          setCategoriesLoading(false)
          return
        }

        const playlistsResponse = await fetch(
          `http://127.0.0.1:8000/clouder_weeks/${clouderWeek}/sp_playlists`
        )
        if (!playlistsResponse.ok) {
          throw new Error("Failed to fetch playlists for the week")
        }
        const playlistsData: SpPlaylist[] = await playlistsResponse.json()

        const categoryObjects = playlistsData
          .filter(p => p.clouder_pl_type === "category" || p.clouder_pl_name === "trash")
          .map(p => ({
            name: p.clouder_pl_name[0].toUpperCase() + p.clouder_pl_name.slice(1),
            playlist_id: p.playlist_id,
          }))

        categoryCache.current[playlistId] = { week: clouderWeek, categories: categoryObjects }
        setCategoryPlaylists(categoryObjects)
      } catch (error) {
        console.error("Failed to fetch category playlists:", error)
        setCategoriesError("Could not load category playlists.")
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategoryPlaylists()
  }, [track?.context?.uri])

  const progress =
    track?.item && track.item.duration_ms > 0
      ? (track.progress_ms / track.item.duration_ms) * 100
      : 0

  if (loading) {
    return <div className="flex flex-col items-center justify-center">Loading player...</div>
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center text-red-500">{error}</div>
  }
  if (!track) {
    return <div className="flex flex-col items-center justify-center">No track playing</div>
  }

  return (
    <div className="mt-4 max-w-[36rem] mx-auto">
      <div className="flex flex-col items-center justify-center gap-4 rounded-md border p-6">
        <div className="text-center">
          <p className="text-lg font-semibold">
            {track?.item?.name ?? "No track playing"}
          </p>
          <p className="text-muted-foreground">
            {track?.item?.artists.map(a => a.name).join(", ") ?? "-"}
          </p>
        </div>
        {track?.item && (
          <div className="w-full flex items-center gap-2">
            <span className="text-xs tabular-nums min-w-[36px] text-right">
              {formatMsToTime(track.progress_ms)}
            </span>
            <Progress value={progress} className="flex-1" />
            <span className="text-xs tabular-nums min-w-[36px] text-left">
              {formatMsToTime(track.item.duration_ms)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleRewind} disabled={!track}>
            <ChevronsLeft className="size-10" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePrevious} disabled={!track}>
            <ArrowLeftCircle className="size-10" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePlayPause} disabled={!track}>
            {track?.is_playing ? (
              <PauseCircle className="size-12" />
            ) : (
              <PlayCircle className="size-12" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext} disabled={!track}>
            <ArrowRightCircle className="size-10" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFastForward} disabled={!track?.item}>
            <ChevronsRight className="size-10" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {[0, 0.2, 0.4, 0.6, 0.8].map((percentage, index) => (
            <Button
              key={percentage}
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 bg-white text-black border-3 border-black font-bold"
              onClick={() => handleSeek(percentage)}
              disabled={!track?.item}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-4 max-w-[36rem] mx-auto">
        {categoriesLoading && <p className="text-center">Loading categories...</p>}
        {categoryPlaylists.length > 0 && (
          <div className="grid grid-cols-4 gap-2 rounded-md border p-4 mx-auto">
            <div className="col-span-4 flex flex-wrap justify-center gap-2">
              {[...categoryPlaylists].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8).map((category, idx) => (
                <Button 
                  key={category.playlist_id} 
                  variant="secondary"
                  className="transition-all active:scale-95 hover:opacity-90 w-32 h-10" 
                  onClick={() => handleMoveTrack(category.playlist_id, track.context?.uri.split(":")[2] || "", categoryPlaylists.find(p => p.name.toLowerCase() === "trash")?.playlist_id || "")}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 