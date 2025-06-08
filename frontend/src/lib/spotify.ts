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

export interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  progress_ms: number;
  context: {
    uri: string;
    type: string;
  } | null;
  item: {
    id: string;
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
  } | null;
}

const SPOTIFY_API_BASE = "https://api.spotify.com/v1"

export async function getAllUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
  let playlists: SpotifyPlaylist[] = []
  let url: string | null = `${SPOTIFY_API_BASE}/me/playlists?limit=50`

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

export async function getCurrentlyPlaying(token:string): Promise<SpotifyCurrentlyPlaying | null> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (response.status === 204) { // No content
        return null;
    }
    if (!response.ok) {
        throw new Error("Failed to fetch currently playing track from Spotify");
    }
    return response.json();
}

export async function playerNext(token: string): Promise<void> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/next`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
      throw new Error("Failed to skip to next track");
    }
}

export async function playerPrevious(token: string): Promise<void> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/previous`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
      throw new Error("Failed to skip to previous track");
    }
}

export async function playerPlay(token: string): Promise<void> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/play`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
      throw new Error("Failed to play track");
    }
}

export async function playerPause(token: string): Promise<void> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/pause`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
      throw new Error("Failed to pause track");
    }
}

export async function playerSeek(token: string, positionMs: number): Promise<void> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/player/seek?position_ms=${Math.round(positionMs)}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
      throw new Error("Failed to seek track position");
    }
} 