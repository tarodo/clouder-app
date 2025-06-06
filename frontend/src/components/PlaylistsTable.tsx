import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { SpotifyPlaylist } from "@/lib/spotify"
import { Input } from "@/components/ui/input"

interface PlaylistsTableProps {
  playlists: SpotifyPlaylist[]
}

const ITEMS_PER_PAGE = 20

export function PlaylistsTable({ playlists }: PlaylistsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState("")

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(filter.toLowerCase())
  )

  const totalPages = Math.ceil(filteredPlaylists.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPlaylists = filteredPlaylists.slice(startIndex, endIndex)

  const goToNextPage = () => {
    setCurrentPage(page => Math.min(page + 1, totalPages))
  }

  const goToPreviousPage = () => {
    setCurrentPage(page => Math.max(page - 1, 1))
  }

  if (playlists.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border">
        You don't have any playlists.
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="py-4">
        <Input
          placeholder="Filter by playlist name..."
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value)
            setCurrentPage(1)
          }}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: "20%" }}>Playlist ID</TableHead>
              <TableHead style={{ width: "20%" }}>Playlist Name</TableHead>
              <TableHead style={{ width: "20%" }}>Playlist URL</TableHead>
              <TableHead style={{ width: "40%" }}>Playlist Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPlaylists.map(playlist => (
              <TableRow key={playlist.id}>
                <TableCell style={{ width: "20%" }} className="font-mono text-xs">{playlist.id}</TableCell>
                <TableCell style={{ width: "20%" }} className="font-medium">{playlist.name}</TableCell>
                <TableCell style={{ width: "20%" }}>
                  <a
                    href={playlist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Open
                  </a>
                </TableCell>
                <TableCell style={{ width: "40%" }} className="max-w-xs truncate whitespace-normal">
                  {playlist.description || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
          Next
        </Button>
      </div>
    </div>
  )
} 