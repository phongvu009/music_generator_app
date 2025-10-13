"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";


export function SongPanel() {
  const [mode, setMode] = useState<"simple" | "custom">("simple")

  return (
    // This div functions as a responsive sidebar panel.
    // By default, it takes the full width of its container (`w-full`).
    // On large screens (1024px and wider, defined by `lg:`), its width is fixed to 20rem (320px) via `lg:w-80`.
    // This is a common pattern for sidebars that are full-width on mobile and fixed-width on desktop.
    //if you hd a header and a footer inside the parent div, the div with flex-1 would expand to fill all the space between them.
    <div className="flex w-full flex-col border-r bg-muted/30 lg:w-80">
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs value={mode} onValueChange={(value) => setMode(value as "simple" | "custom")}  >
          <TabsList className="w-full">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>

          </TabsList>

        </Tabs>
      </div>
    </div>
  )
}
