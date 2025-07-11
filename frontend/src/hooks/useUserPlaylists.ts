import { useState, useEffect } from "react"
import { getAllUserPlaylists, type SpotifyPlaylist } from "@/lib/spotify"
import { isLoggedIn } from "@/lib/auth"

export function useUserPlaylists() {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isLoggedIn()) {
        // This case is handled by AppLayout, but as a fallback:
        setError("Authentication token not found.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const userPlaylists = await getAllUserPlaylists()
        setPlaylists(userPlaylists)
      } catch (e) {
        console.error(e)
        setError("Failed to fetch playlists. Your session may have expired.")
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [])

  return { playlists, loading, error }
} 