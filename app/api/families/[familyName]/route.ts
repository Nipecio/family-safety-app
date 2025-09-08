import { type NextRequest, NextResponse } from "next/server"

// In-memory storage (in production, use a real database)
const families: Record<
  string,
  {
    password: string
    members: Array<{
      id: number
      name: string
      isOnline: boolean
      location: {
        lat: number
        lng: number
        address: string
        timestamp: string
      } | null
    }>
  }
> = {
  // Demo families
  smiths: {
    password: "family123",
    members: [
      {
        id: 1,
        name: "John Smith",
        isOnline: true,
        location: {
          lat: 40.7128,
          lng: -74.006,
          address: "New York, NY",
          timestamp: new Date().toISOString(),
        },
      },
      {
        id: 2,
        name: "Sarah Smith",
        isOnline: true,
        location: {
          lat: 40.7589,
          lng: -73.9851,
          address: "Times Square, NY",
          timestamp: new Date().toISOString(),
        },
      },
    ],
  },
}

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
