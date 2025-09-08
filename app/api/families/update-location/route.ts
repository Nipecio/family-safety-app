import { type NextRequest, NextResponse } from "next/server"
import { families } from "@/lib/families-store"

export async function POST(request: NextRequest) {
  try {
    const { familyName, userName, location } = await request.json()

    if (!familyName || !userName || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const family = families[familyName]
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    const member = family.members.find((m) => m.name === userName)
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Update member location
    member.location = location
    member.isOnline = true

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
