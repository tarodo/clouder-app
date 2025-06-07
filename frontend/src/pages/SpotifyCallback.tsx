import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { setTokens } from "@/lib/auth"

export default function SpotifyCallbackPage() {
  const navigate = useNavigate()
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash
        ? window.location.hash.substring(1)
        : window.location.search.substring(1)
    )
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    if (accessToken) {
      setTokens(accessToken, refreshToken)
      navigate("/playlists") // Redirect to playlists after login
    } else {
      navigate("/") // Or back to login on failure
    }
  }, [navigate])
  return <div>Logging in...</div>
} 