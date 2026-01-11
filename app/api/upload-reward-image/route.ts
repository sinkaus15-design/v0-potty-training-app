import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create unique filename
    const fileExt = file.name.split(".").pop() || "jpg"
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("reward-images").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("reward-images").getPublicUrl(data.path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
