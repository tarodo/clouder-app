import { useState, useEffect, useCallback } from "react"
import {
  playerNext,
  playerPause,
  playerPlay,
  playerPrevious,
  playerSeek,
  type SpotifyCurrentlyPlaying,
} from "@/lib/spotify"
import { isLoggedIn } from "@/lib/auth"
import { spotifyFetch } from "@/lib/api"

declare global {
  interface Window {
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => Spotify.Player;
    };
  }
}

const ACTION_DELAY = 500 // Delay to allow Spotify API to update state
const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

export function useSpotifyPlayer() {
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [track, setTrack] = useState<SpotifyCurrentlyPlaying | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Update track position every second when playing
  useEffect(() => {
    if (!isPlaying || !track?.item) return

    const interval = setInterval(() => {
      setTrack(prev => {
        if (!prev?.item) return prev
        return {
          ...prev,
          progress_ms: Math.min(prev.progress_ms + 1000, prev.item.duration_ms)
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, track?.item])

  // Transfer playback to our device
  const transferPlayback = useCallback(async (deviceId: string) => {
    try {
      await spotifyFetch(`${SPOTIFY_API_BASE}/me/player`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: [deviceId], play: true })
      })
    } catch (e) {
      console.error('Failed to transfer playback:', e)
      // Don't set error state here as this is not critical
    }
  }, [])

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!isLoggedIn() || typeof window === 'undefined') return

    // Intercept fetch requests to suppress SDK errors
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [resource, config] = args
      if (typeof resource === 'string' && resource.includes('cpapi.spotify.com')) {
        try {
          const response = await originalFetch(resource, config)
          if (!response.ok && (
            resource.includes('/event/item_before_load') ||
            resource.includes('/event/playback_speed_change')
          )) {
            // Return a fake successful response for known error cases
            return new Response(JSON.stringify({}), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          return response
        } catch (error) {
          if (error instanceof Error && (
            error.message.includes('CloudPlaybackClientError') ||
            error.message.includes('PlayLoad event failed')
          )) {
            // Return a fake successful response for known error cases
            return new Response(JSON.stringify({}), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            })
          }
          throw error
        }
      }
      return originalFetch(resource, config)
    }

    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true

    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Clouder Player',
        getOAuthToken: cb => {
          const token = localStorage.getItem('spotify_access_token')
          if (token) cb(token)
        },
        volume: 0.5
      })

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        if (message.includes('CloudPlaybackClientError')) return
        console.error('Failed to initialize:', message)
        setError('Failed to initialize Spotify player')
      })
      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message)
        setError('Failed to authenticate with Spotify')
      })
      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message)
        setError('Failed to validate Spotify account')
      })
      player.addListener('playback_error', ({ message }: { message: string }) => {
        if (message.includes('CloudPlaybackClientError')) return
        console.error('Failed to perform playback:', message)
        setError('Failed to perform playback')
      })

      // Playback status updates
      player.addListener('player_state_changed', (state: Spotify.PlaybackState) => {
        if (!state) return

        // Extract playlist type from URI if it's a playlist
        const isPlaylist = state.context?.uri?.startsWith('spotify:playlist:')
        const contextType = isPlaylist ? 'playlist' : (typeof state.context?.metadata?.type === 'string' ? state.context.metadata.type : 'unknown')

        setIsPlaying(!state.paused)
        setTrack({
          is_playing: !state.paused,
          progress_ms: state.position,
          context: state.context ? {
            uri: state.context.uri,
            type: contextType
          } : null,
          item: state.track_window.current_track ? {
            id: state.track_window.current_track.id,
            name: state.track_window.current_track.name,
            duration_ms: state.track_window.current_track.duration_ms,
            artists: state.track_window.current_track.artists.map(a => ({ name: a.name })),
            album: {
              name: state.track_window.current_track.album.name,
              images: state.track_window.current_track.album.images.map(img => ({ url: img.url }))
            }
          } : null
        })
        setLoading(false)
      })

      // Ready
      player.addListener('ready', async ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id)
        setDeviceId(device_id)
        await transferPlayback(device_id)
        setLoading(false)
      })

      // Not Ready
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id)
        if (deviceId === device_id) {
          setDeviceId(null)
        }
      })

      // Connect to the player!
      player.connect()
      setPlayer(player)
    }

    return () => {
      if (player) {
        player.disconnect()
      }
      document.body.removeChild(script)
      window.fetch = originalFetch // Restore original fetch
    }
  }, [transferPlayback])

  const performPlayerAction = useCallback(
    async (action: () => Promise<void>) => {
      if (!isLoggedIn() || !player) return
      try {
        await action()
      } catch (e) {
        console.error(e)
        setError("Player command failed.")
      }
    },
    [player]
  )

  const handlePrevious = useCallback(() => {
    if (!player) return
    performPlayerAction(() => player.previousTrack())
  }, [player, performPlayerAction])

  const handleNext = useCallback(() => {
    if (!player) return
    performPlayerAction(() => player.nextTrack())
  }, [player, performPlayerAction])

  const handlePlayPause = useCallback(async () => {
    if (!player || !track) return
    await performPlayerAction(() => player.togglePlay())
  }, [player, track, performPlayerAction])

  const handleSeek = useCallback((percentage: number) => {
    if (!player || !track?.item) return
    const positionMs = track.item.duration_ms * percentage
    performPlayerAction(() => player.seek(positionMs))
  }, [player, track, performPlayerAction])

  const handleRewind = useCallback(() => {
    if (!player || !track) return
    const newPositionMs = Math.max(0, track.progress_ms - 10000)
    performPlayerAction(() => player.seek(newPositionMs))
  }, [player, track, performPlayerAction])

  const handleFastForward = useCallback(() => {
    if (!player || !track?.item) return
    const newPositionMs = Math.min(track.item.duration_ms, track.progress_ms + 10000)
    performPlayerAction(() => player.seek(newPositionMs))
  }, [player, track, performPlayerAction])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const keyMap: Record<string, (() => void) | undefined> = {
        " ": handlePlayPause,
        ">": handleNext,
        "<": handlePrevious,
        ".": handleFastForward,
        ",": handleRewind,
        "1": () => handleSeek(0),
        "2": () => handleSeek(0.2),
        "3": () => handleSeek(0.4),
        "4": () => handleSeek(0.6),
        "5": () => handleSeek(0.8),
      }

      const action = keyMap[e.key]
      if (action) {
        e.preventDefault()
        action()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlePlayPause, handleNext, handlePrevious, handleFastForward, handleRewind, handleSeek])

  return { track, loading, error, handlePrevious, handleNext, handlePlayPause, handleSeek, handleRewind, handleFastForward }
} 