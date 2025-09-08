import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { familyName, password, userName } = await request.json()

    if (!familyName || !password || !userName) {
      return NextResponse.json({ error: "Please fill in all fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if family name already exists
    const { data: existingFamily } = await supabase.from("families").select("id").eq("name", familyName).single()

    if (existingFamily) {
      return NextResponse.json(
        { error: "Family name already exists. Please choose a different name." },
        { status: 400 },
      )
    }

    // Create new family
    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({
        name: familyName,
        password: password,
      })
      .select()
      .single()

    if (familyError) {
      throw familyError
    }

    // Add the creator as the first family member
    const { data: member, error: memberError } = await supabase
      .from("family_members")
      .insert({
        family_id: family.id,
        name: userName,
        is_sharing_location: false,
      })
      .select()
      .single()

    if (memberError) {
      throw memberError
    }

    return NextResponse.json({
      success: true,
      family: {
        name: familyName,
        members: [
          {
            id: member.id,
            name: member.name,
            isOnline: true,
            location: null,
          },
        ],
      },
    })
  } catch (error) {
    console.error("Create family error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
