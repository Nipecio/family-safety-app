// In-memory storage (in production, use a real database)
export const families: Record<
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
