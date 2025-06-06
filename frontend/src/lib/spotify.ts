export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  external_urls: {
    spotify: string
  }
}

interface PlaylistsApiResponse {
  items: SpotifyPlaylist[]
  next: string | null
}

export async function getAllUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  let playlists: SpotifyPlaylist[] = []
  let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50"

  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch playlists from Spotify")
    }

    const data: PlaylistsApiResponse = await response.json()
    playlists = playlists.concat(data.items)
    url = data.next
  }

  return playlists
} 