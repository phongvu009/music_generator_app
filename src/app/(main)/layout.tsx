import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "~/components/ui/sonner";
import { Providers } from "~/components/providers";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/sidebar/app-sidebar";
import { Separator } from "@radix-ui/react-separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from "~/components/ui/breadcrumb";
import BreadcrumbPageClient from "~/components/sidebar/breadcrumb-page-client";
import SoundBar from "~/components/sound-bar";

export const metadata: Metadata = {
  title: "Home",
  description: "Music Generator",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex h-screen flex-col">
              <header className="bg-background sticky-top z-10 border-b px-4 py-2 ">
                <div className="flex shrink-0 grow items-center gap-2 bg-green-200">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbPageClient />
                      </BreadcrumbItem>
                    </BreadcrumbList>

                  </Breadcrumb>
                </div>

              </header>
              <main className="flex-1 overflow-y-auto bg-blue-200">
                {children}
              </main>

              <SoundBar />


            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
