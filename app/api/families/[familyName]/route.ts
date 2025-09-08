import { type NextRequest, NextResponse } from "next/server"
import { families } from "@/lib/families-store"

export async function GET(request: NextRequest, { params }: { params: { familyName: string } }) {
  try {
    const familyName = params.familyName
    const family = families[familyName]

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    return NextResponse.json({
      name: familyName,
      members: family.members,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
