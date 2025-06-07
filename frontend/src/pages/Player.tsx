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