import { Button } from "@/components/ui/button"
import {
  getCurrentlyPlaying,
  playerNext,
  playerPause,
  playerPlay,
  playerPrevious,
  type SpotifyCurrentlyPlaying,
} from "@/lib/spotify"
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  PauseCircle,
  PlayCircle,
} from "lucide-react"
import { useEffect, useState, useCallback } from "react"

export default function PlayerPage() {
  const [track, setTrack] = useState<SpotifyCurrentlyPlaying | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const token = localStorage.getItem("spotify_access_token")

  const fetchCurrentTrack = useCallback(async () => {
    if (!token) {
      setError("Authentication token not found.")
      setLoading(false)
      return
    }
    try {
      const currentTrack = await getCurrentlyPlaying(token)
      setTrack(currentTrack)
    } catch (e) {
      console.error(e)
      setError("Failed to fetch current track. Your session may have expired.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    setLoading(true)
    fetchCurrentTrack()
  }, [fetchCurrentTrack])

  const handlePrevious = async () => {
    if (!token) return
    await playerPrevious(token)
    setTimeout(fetchCurrentTrack, 500) // Give Spotify time to update
  }

  const handleNext = async () => {
    if (!token) return
    await playerNext(token)
    setTimeout(fetchCurrentTrack, 500)
  }

  const handlePlayPause = async () => {
    if (!token || !track) return
    if (track.is_playing) {
      await playerPause(token)
    } else {
      await playerPlay(token)
    }
    setTimeout(fetchCurrentTrack, 500)
  }

  if (loading) {
    return <div className="flex flex-col items-center justify-center">Loading player...</div>
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center">Error: {error}</div>
  }

  return (
    <div>
      <h1 className="mb-6 text-left text-3xl font-bold">Player</h1>
      <div className="flex flex-col items-center justify-center gap-4 rounded-md border p-8">
        <div className="text-center">
          <p className="text-lg font-semibold">
            {track?.item?.name ?? "No track playing"}
          </p>
          <p className="text-muted-foreground">
            {track?.item?.artists.map(a => a.name).join(", ") ?? "-"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handlePrevious} disabled={!track}>
            <ArrowLeftCircle className="size-8" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePlayPause} disabled={!track}>
            {track?.is_playing ? (
              <PauseCircle className="size-10" />
            ) : (
              <PlayCircle className="size-10" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext} disabled={!track}>
            <ArrowRightCircle className="size-8" />
          </Button>
        </div>
      </div>
    </div>
  )
} 