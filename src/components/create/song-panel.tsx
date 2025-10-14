"use client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { Badge } from "../ui/badge"
import { Loader2, Music, Plus } from "lucide-react"
import { toast } from "sonner";
import { generateSong, type GenerateRequest } from "~/actions/generation";


const inspirationTags = [
  "80s synth-pop",
  "Acoustic ballad",
  "Epic movie score",
  "Lo-fi hip hop",
  "Driving rock anthem",
  "Summer beach vibe",
];

const styleTags = [
  "Industrial rave",
  "Heavy bass",
  "Orchestral",
  "Electronic beats",
  "Funky guitar",
  "Soulful vocals",
  "Ambient pads",
];

//This will show wiget for simple tab Or custom tab
export function SongPanel() {
  //keep track tab mode
  const [mode, setMode] = useState<"simple" | "custom">("simple")
  //keep track input field for song description
  const [description, setDescription] = useState("");
  //keep track of toggle/switch instrumental
  const [instrumental, setInstrumental] = useState(false)
  //keep track lyrics mode
  const [lyricsMode, setLyricsMode] = useState<"write" | "auto">("write")
  //keep track lyrics
  const [lyrics, setLyrics] = useState("")
  const [styleInput, setStyleInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleStyleInputTagClick = (tag: string) => {
    const currentTags = styleInput
      .split(", ")
      .map((s) => s.trim()) // removing any accidental leading or trailing whitespace.
      .filter((s) => s); // remove any empty strin
    //
    if (!currentTags.includes(tag)) {
      //Add tag to empty description without "," at the beginning
      if (styleInput.trim() === "") {
        setStyleInput(tag);
      } else {
        //add ,tag if there is a description
        setStyleInput(styleInput + ", " + tag);
      }
    }
  }

  const handleInspirationTagClick = (tag: string) => {
    const currentTags = description
      .split(", ")
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

  const handleCreate = async () => {
    //Falsy values: "" (empty string), 0, false, null, undefined.
    //if decription is empty
    if (mode === "simple" && !description.trim()) {
      toast.error("Please describe your song before creating")
      return
    }
    if (mode === "custom" && !styleInput.trim()) {
      toast.error("Please fill in styles")
      return
    }
    //Generate Song
    let requestBody: GenerateRequest;

    //Update requestBody using state which is kept tracked by react hook

    if (mode === "simple") {
      requestBody = {
        fullDescribedSong: description,
        instrumental: instrumental

      }
    } else {
      //for custom mode
      const prompt = styleInput;
      if (lyricsMode === "write") {
        //manual lyric
        requestBody = {
          prompt,
          lyrics,
          instrumental
        }
      } else {
        //auto lyrics
        requestBody = {
          prompt,
          describedLyrics: lyrics,
          instrumental,
        }
      }
    }

    try {
      setLoading(true);
      await generateSong(requestBody);
      setDescription("");
      setLyrics("");
      setStyleInput("");
    } catch (error) {
      toast.error("Failed to genreate song")

    } finally {
      setLoading(false)

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
          {/* show child content for tab clicked */}
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

          <TabsContent value="custom" className="mt-6 space-y-6">
            {/* lyrics widget */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between ">
                <label className="text-sm font-medium">Lyrics</label>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    variant={lyricsMode === "auto" ? "secondary" : "ghost"}
                    onClick={() => {
                      setLyricsMode("auto");
                      setLyrics("");
                    }}
                  >Auto
                  </Button>

                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    variant={lyricsMode === "write" ? "secondary" : "ghost"}
                    onClick={() => {
                      setLyricsMode("write");
                      setLyrics("");
                    }}
                  >Write
                  </Button>
                </div>
              </div>

              {/* input text */}
              <Textarea
                placeholder={
                  lyricsMode === "write"
                    ? "Add your own lyric here"
                    : "Describe about your song: (e.g., a wonderful day ...)to genereate lyrics"
                }
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* instrumental */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Instrumental</label>
              <Switch
                checked={instrumental}
                onCheckedChange={setInstrumental}

              />
            </div>

            {/* Style */}
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Styles</label>
              <Textarea
                placeholder="Enter style tags"
                value={styleInput}
                onChange={(e) => setStyleInput(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <div className="w-full overflow-x-auto whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  {
                    styleTags.map((tag) => (

                      <Badge
                        variant="secondary"
                        key={tag}
                        className="hover:bg-secondary/50 flex-shrink-0 cursor-pointer text-sm"
                        onClick={() => handleStyleInputTagClick(tag)}
                      >{tag}</Badge>))
                  }
                </div>
              </div>
            </div>

          </TabsContent>

        </Tabs>
      </div>
      {/* Button to submit/create */}
      <div className="border-t p-4">
        <Button
          disabled={loading}
          onClick={handleCreate}
          className="w-full cursor-pointer bg-gradient-to-r from-orange-500 to-pink-500 font-medium text-white hover:from-orange-600 hover:to-pink-600">
          {loading ? <Loader2 className="animate-spin" /> : <Music />}
          {loading ? "Creating...." : "Create"}</Button>
      </div>
    </div>
  )
}
