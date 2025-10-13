"use server"

import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar"
import SidebarMenuItems from "./sidebar-menu-items"
import Credits from "./credits"
import Upgrade from "./upgrade"
import { UserButton } from "@daveyplate/better-auth-ui"
import { User } from "lucide-react"

export async function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary mt-4 mb-12 flex flex-col items-start justify-start px-2 text-3xl font-black tracking-widest uppercase">
            <p>Music</p>
            <p className="text-lg">Generator</p>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-red-200">
        <div className="mb-2 flex w-full items-center justify-center gap-1 text-xs"  >
          <Credits />
          <Upgrade />
        </div>
        <UserButton
          variant="outline"
          additionalLinks={[
            {
              label: "Customer Portal",
              href: "/cusomter-portal",
              icon: <User />
            }
          ]}
        />
      </SidebarFooter>

    </Sidebar >
  )
}
