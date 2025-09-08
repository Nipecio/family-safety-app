import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { familyName, password, userName } = await request.json()

    if (!familyName || !password || !userName) {
      return NextResponse.json({ error: "Please fill in all fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find family by name and verify password
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id, name, password")
      .eq("name", familyName)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    if (family.password !== password) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", family.id)
      .eq("name", userName)
      .single()

    // Add user to family if not already present
    if (!existingMember) {
      const { error: memberError } = await supabase.from("family_members").insert({
        family_id: family.id,
        name: userName,
        is_sharing_location: false,
      })

      if (memberError) {
        throw memberError
      }
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
        member.latitude && member.longitude
          ? {
              lat: Number.parseFloat(member.latitude),
              lng: Number.parseFloat(member.longitude),
              address: `${member.latitude}, ${member.longitude}`,
              timestamp: member.last_updated || new Date().toISOString(),
            }
          : null,
    }))

    return NextResponse.json({
      success: true,
      family: {
        name: familyName,
        members: formattedMembers,
      },
    })
  } catch (error) {
    console.error("Join family error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
