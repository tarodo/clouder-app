import { Button } from "@/components/ui/button"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { useEffect } from "react"

function SpotifyCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")
    if (access_token) localStorage.setItem("spotify_access_token", access_token)
    if (refresh_token) localStorage.setItem("spotify_refresh_token", refresh_token)
    navigate("/", { replace: true })
  }, [navigate])
  return <div>Logging in...</div>
}

function Home() {
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