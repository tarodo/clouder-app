import { Button } from "@/components/ui/button"
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Outlet,
  useLocation,
} from "react-router-dom"
import { useEffect } from "react"
import PlayerPage from "./pages/Player"
import PlaylistsPage from "@/pages/Playlists"
import { MainMenu } from "@/components/MainMenu"

function SpotifyCallback() {
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash ? window.location.hash.substring(1) : window.location.search.substring(1)
    )
    const accessToken = params.get("access_token")
    if (accessToken) {
      localStorage.setItem("spotify_access_token", accessToken)
      navigate("/playlists") // Redirect to playlists after login
    } else {
      navigate("/") // Or back to login on failure
    }
  }, [navigate])
  return <div>Logging in...</div>
}

function LoginPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem("spotify_access_token")

  useEffect(() => {
    if (token) {
      navigate("/playlists")
    }
  }, [token, navigate])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button asChild>
        <a href="http://127.0.0.1:8000/login">Login with Spotify</a>
      </Button>
    </div>
  )
}

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem("spotify_access_token")

  useEffect(() => {
    if (!token) {
      navigate("/")
    }
  }, [token, navigate, location.pathname])

  if (!token) {
    return null // or a loading spinner, but redirect will happen
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <MainMenu />
      <Outlet />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/spotify-callback" element={<SpotifyCallback />} />
        <Route element={<AppLayout />}>
          <Route path="/player" element={<PlayerPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}