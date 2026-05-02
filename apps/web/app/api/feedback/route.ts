import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const FEEDBACK_CATEGORIES = new Set(["bug", "feature request", "general feedback"])

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const name = typeof body?.name === "string" ? body.name.trim() : null
    const email = typeof body?.email === "string" ? body.email.trim() : null
    const message = typeof body?.message === "string" ? body.message.trim() : ""
    const category = typeof body?.category === "string" ? body.category.trim().toLowerCase() : ""

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 })
    }

    if (!FEEDBACK_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server configuration is incomplete." }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await supabase.from("feedback_submissions").insert({
      name,
      email,
      message,
      category,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 })
  }
}
