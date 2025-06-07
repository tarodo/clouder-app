import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"
import PlayerPage from "./pages/Player"
import PlaylistsPage from "./pages/Playlists"
import LoginPage from "@/pages/Login"
import SpotifyCallbackPage from "@/pages/SpotifyCallback"
import { AppLayout } from "@/components/AppLayout"
import LogoutPage from "@/pages/Logout"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/spotify-callback" element={<SpotifyCallbackPage />} />
        <Route element={<AppLayout />}>
          <Route path="/player" element={<PlayerPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
        </Route>
        <Route path="/logout" element={<LogoutPage />} />
      </Routes>
    </BrowserRouter>
  )
}