import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { isLoggedIn } from "@/lib/auth"

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoggedIn()) {
      navigate("/playlists")
    }
  }, [navigate])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <Button asChild>
        <a href="http://127.0.0.1:8000/login">Login with Spotify</a>
      </Button>
    </div>
  )
} 