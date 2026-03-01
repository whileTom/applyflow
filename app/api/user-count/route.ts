import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()

    // Call the function to increment page views and potentially the user count
    const { data, error } = await supabase.rpc("increment_user_counter_on_view")

    if (error) {
      // Fallback to just reading the count if function fails
      const { data: fallbackData } = await supabase.from("user_counter").select("count").eq("id", 1).single()

      return NextResponse.json({ count: fallbackData?.count || 312 }, { status: 200 })
    }

    // The RPC returns an array with one object
    const result = Array.isArray(data) ? data[0] : data

    return NextResponse.json({ count: result?.count || 312 }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ count: 312 }, { status: 200 })
  }
}
