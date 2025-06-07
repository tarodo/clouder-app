import { PlaylistsTable } from "@/components/PlaylistsTable"
import { useUserPlaylists } from "@/hooks/useUserPlaylists"

export default function PlaylistsPage() {
  const { playlists, loading, error } = useUserPlaylists()

  if (loading) {
    return <div className="flex flex-col items-center justify-center">Loading playlists...</div>
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center text-red-500">{error}</div>
  }
  if (!playlists) {
    return <div className="flex flex-col items-center justify-center">No playlists found</div>
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