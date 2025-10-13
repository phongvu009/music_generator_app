"use client";
import { usePathname } from "next/navigation";
import { Home, Music } from "lucide-react"
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
/**
 * Renders the menu items for the application sidebar.
 * It dynamically determines which menu item is active based on the current URL path.
 */
export default function SidebarMenuItems() {
  // Get the current path from Next.js router to determine the active link.
  const path = usePathname();

  // Define the sidebar menu items.
  // Each item has a title, URL for navigation, an icon component,
  // and an initial active state which will be updated.
  let menuItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
      active: false
    },
    {
      title: "Create",
      url: "/create",
      icon: Music,
      active: false
    }
  ]
  //After having path 
  // Update the active state of each item by comparing its URL with the current path.
  // This creates a new array with the correct active states.
  const items = menuItems.map((item) => ({
    ...item,
    active: path === item.url
  }))

  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.active}>
            <a href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  )
}
