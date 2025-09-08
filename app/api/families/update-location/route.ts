import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { familyName, userName, location } = await request.json()

    if (!familyName || !userName || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find family by name
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id")
      .eq("name", familyName)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    // Update member location
    const { error: updateError } = await supabase
      .from("family_members")
      .update({
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        is_sharing_location: true,
        last_updated: new Date().toISOString(),
      })
      .eq("family_id", family.id)
      .eq("name", userName)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update location error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
