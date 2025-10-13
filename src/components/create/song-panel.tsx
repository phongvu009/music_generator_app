"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { Plus } from "lucide-react"


const inspirationTags = [
  "80s synth-pop",
  "Acoustic ballad",
  "Epic movie score",
  "Lo-fi hip hop",
  "Driving rock anthem",
  "Summer beach vibe",
];

export function SongPanel() {
  //keep track tab mode
  const [mode, setMode] = useState<"simple" | "custom">("simple")
  //keep track input field for song description
  const [description, setDescription] = useState("");
  //keep track of toggle/switch instrumental
  const [instrumental, setInstrumental] = useState(false)

  const handleInspirationTagClick = (tag: string) => {
    const currentTags = description
      .split(",")
      .map((s) => s.trim()) // removing any accidental leading or trailing whitespace.
      .filter((s) => s); // remove any empty strin
    //
    if (!currentTags.includes(tag)) {
      //Add tag to empty description without "," at the beginning
      if (description.trim() === "") {
        setDescription(tag);
      } else {
        //add ,tag if there is a description
        setDescription(description + ", " + tag);
      }
    }
  }

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

          <TabsContent value="simple" className="mt-6 space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Describe your song</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="EDM to have joy"
                className="min-h-[120px] resize-none" />
            </div>

            {/* lyrics section */}
            <div className="flex items-center justify-between">
              {/* lyrics button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("custom")}
              >
                <Plus className="mr-2" />
                Lyrics
              </Button>
              {/* instrumental */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Instrumental</label>
                <Switch
                  checked={instrumental}
                  onCheckedChange={setInstrumental}

                />
              </div>

            </div>

            {/* inspiration section */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Inspiration</label>
              <div className="w-full overflow-x-auto whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {inspirationTags.map((tag) => (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 flex-shrink-0 bg-transparent text-xs"
                      key={tag}
                      onClick={() => handleInspirationTagClick(tag)}
                    >
                      <Plus className="mr-1" />
                      {tag}

                    </Button>
                  ))}
                </div>
              </div>
            </div>

          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
