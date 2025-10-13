"use client";
import { Button } from "./ui/button"
import { queueSong } from "~/actions/generation"

export default function CreateSong() {

  return <Button onClick={queueSong}>Generate Song</Button>
}
