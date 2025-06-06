import { Button } from "@/components/ui/button"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { PlaylistsTable } from "@/components/PlaylistsTable"
import { getAllUserPlaylists } from "@/lib/spotify"
import type { SpotifyPlaylist } from "@/lib/spotify"

function SpotifyCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get("access_token")
    if (accessToken) {
      localStorage.setItem("spotify_access_token", accessToken)
      navigate("/")
    }
  }, [navigate])
  return <div>Logging in...</div>
}

function Dashboard() {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlaylists = async () => {
      const token = localStorage.getItem("spotify_access_token")
      if (!token) {
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
    return <div className="flex min-h-svh flex-col items-center justify-center">Loading playlists...</div>
  }

  if (error) {
    return <div className="flex min-h-svh flex-col items-center justify-center">Error: {error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-left text-3xl font-bold">Your Spotify Playlists</h1>
      {playlists && <PlaylistsTable playlists={playlists} />}
    </div>
  )
}

function Home() {
  const token = localStorage.getItem("spotify_access_token")

  if (token) {
    return <Dashboard />
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button asChild>
        <a href="http://127.0.0.1:8000/login">Login with Spotify</a>
      </Button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/spotify-callback" element={<SpotifyCallback />} />
      </Routes>
    </BrowserRouter>
  )
}