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

export async function POST(request: NextRequest) {
  try {
    const { familyName, password, userName } = await request.json()

    if (!familyName || !password || !userName) {
      return NextResponse.json({ error: "Please fill in all fields" }, { status: 400 })
    }

    const family = families[familyName]
    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    if (family.password !== password) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    // Add user to family if not already present
    const existingUser = family.members.find((m) => m.name === userName)
    if (!existingUser) {
      family.members.push({
        id: Date.now(),
        name: userName,
        isOnline: true,
        location: null,
      })
    }

    return NextResponse.json({
      success: true,
      family: {
        name: familyName,
        members: family.members,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
