import { type NextRequest, NextResponse } from "next/server"
import { families } from "@/lib/families-store"

// In-memory storage (in production, use a real database)
// const families: Record<
//   string,
//   {
//     password: string
//     members: Array<{
//       id: number
//       name: string
//       isOnline: boolean
//       location: {
//         lat: number
//         lng: number
//         address: string
//         timestamp: string
//       } | null
//     }>
//   }
// > = {
//   // Demo families
//   smiths: {
//     password: "family123",
//     members: [
//       {
//         id: 1,
//         name: "John Smith",
//         isOnline: true,
//         location: {
//           lat: 40.7128,
//           lng: -74.006,
//           address: "New York, NY",
//           timestamp: new Date().toISOString(),
//         },
//       },
//       {
//         id: 2,
//         name: "Sarah Smith",
//         isOnline: true,
//         location: {
//           lat: 40.7589,
//           lng: -73.9851,
//           address: "Times Square, NY",
//           timestamp: new Date().toISOString(),
//         },
//       },
//     ],
//   },
// }

export async function POST(request: NextRequest) {
  try {
    const { familyName, password, userName } = await request.json()

    if (!familyName || !password || !userName) {
      return NextResponse.json({ error: "Please fill in all fields" }, { status: 400 })
    }

    if (families[familyName]) {
      return NextResponse.json(
        { error: "Family name already exists. Please choose a different name." },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Create new family
    families[familyName] = {
      password,
      members: [
        {
          id: Date.now(),
          name: userName,
          isOnline: true,
          location: null,
        },
      ],
    }

    return NextResponse.json({
      success: true,
      family: {
        name: familyName,
        members: families[familyName].members,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
