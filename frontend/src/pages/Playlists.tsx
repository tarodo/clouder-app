import { useEffect, useState } from "react"
import { PlaylistsTable } from "@/components/PlaylistsTable"
import { getAllUserPlaylists } from "@/lib/spotify"
import type { SpotifyPlaylist } from "@/lib/spotify"

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlaylists = async () => {
      const token = localStorage.getItem("spotify_access_token")
      if (!token) {
        // This case is handled by AppLayout, but as a fallback:
        setError("Authentication token not found.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const userPlaylists = await getAllUserPlaylists(token)
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

  if (loading) {
    return <div className="flex flex-col items-center justify-center">Loading playlists...</div>
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center">Error: {error}</div>
  }

  return (
    <div>
      <h1 className="mb-6 text-left text-3xl font-bold">
        Your Spotify Playlists
      </h1>
      {playlists && <PlaylistsTable playlists={playlists} />}
    </div>
  )
} 