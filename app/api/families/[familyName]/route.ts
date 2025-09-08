import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { familyName: string } }) {
  try {
    const familyName = params.familyName
    const supabase = await createClient()

    // Find family by name
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id, name")
      .eq("name", familyName)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    // Get all family members
    const { data: members, error: membersError } = await supabase
      .from("family_members")
      .select("id, name, latitude, longitude, is_sharing_location, last_updated")
      .eq("family_id", family.id)

    if (membersError) {
      throw membersError
    }

    // Format members for frontend
    const formattedMembers = members.map((member) => ({
      id: member.id,
      name: member.name,
      isOnline: true,
      location:
        member.latitude && member.longitude && member.is_sharing_location
          ? {
              lat: Number.parseFloat(member.latitude),
              lng: Number.parseFloat(member.longitude),
              address: `${member.latitude}, ${member.longitude}`,
              timestamp: member.last_updated || new Date().toISOString(),
            }
          : null,
    }))

    return NextResponse.json({
      name: familyName,
      members: formattedMembers,
    })
  } catch (error) {
    console.error("Get family data error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
