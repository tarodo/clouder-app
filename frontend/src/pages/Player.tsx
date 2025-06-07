import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  getCurrentlyPlaying,
  playerNext,
  playerPause,
  playerPlay,
  playerPrevious,
  playerSeek,
  type SpotifyCurrentlyPlaying,
} from "@/lib/spotify"
import {
  ArrowLeftCircle,
  ArrowRightCircle,
  ChevronsLeft,
  ChevronsRight,
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
    if (!token) return
    try {
      await playerPause(token)
    } catch (e) {
      await playerPlay(token)
    }
    setTimeout(fetchCurrentTrack, 500)
    // TODO: add a loading state for the button
  }

  const handleSeek = async (percentage: number) => {
    if (!token || !track?.item) return
    const positionMs = track.item.duration_ms * percentage
    await playerSeek(token, positionMs)
    setTimeout(fetchCurrentTrack, 500) // Give Spotify time to update
  }

  const handleRewind = async () => {
    if (!token || !track) return
    const newPositionMs = Math.max(0, track.progress_ms - 10000)
    await playerSeek(token, newPositionMs)
    setTimeout(fetchCurrentTrack, 500)
  }

  const handleFastForward = async () => {
    if (!token || !track?.item) return
    const newPositionMs = Math.min(
      track.item.duration_ms,
      track.progress_ms + 10000,
    )
    await playerSeek(token, newPositionMs)
    setTimeout(fetchCurrentTrack, 500)
  }

  // Обработчик клавиш
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === " ") {
      e.preventDefault()
      handlePlayPause()
    } else if (e.key === ">" || (e.shiftKey && e.key === ".")) {
      e.preventDefault()
      handleNext()
    } else if (e.key === "<" || (e.shiftKey && e.key === ",")) {
      e.preventDefault()
      handlePrevious()
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      handleRewind()
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      handleFastForward()
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchCurrentTrack()
    const intervalId = setInterval(fetchCurrentTrack, 2000)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [fetchCurrentTrack])

  const progress =
    track?.item && track.item.duration_ms > 0 ? (track.progress_ms / track.item.duration_ms) * 100 : 0

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
        {track?.item && (
          <div className="w-1/2 mx-auto flex items-center gap-2">
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
        <div className="flex items-center gap-2 mt-4">
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
    </div>
  )
}

function formatMsToTime(ms: number) {
  if (!ms || ms < 0) return "0:00"
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
} 