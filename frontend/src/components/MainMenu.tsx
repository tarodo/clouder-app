import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { useNavigate } from "react-router-dom"

export function MainMenu() {
  const navigate = useNavigate()

  return (
    <Menubar className="mb-4">
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer" onClick={() => navigate("/player")}>Player</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer" onClick={() => navigate("/playlists")}>Playlists</MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  )
} 