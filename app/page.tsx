"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const FamilyMap = dynamic(() => import("../components/FamilyMap"), { ssr: false })

interface Location {
  lat: number
  lng: number
  address: string
  timestamp: string
}

interface Member {
  id: number
  name: string
  isOnline: boolean
  location: Location | null
}

interface Family {
  name: string
  members: Member[]
}

export default function FamilySafetyApp() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [currentFamily, setCurrentFamily] = useState<string | null>(null)
  const [isLocationSharing, setIsLocationSharing] = useState(false)
  const [familyData, setFamilyData] = useState<Family | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [familyName, setFamilyName] = useState("")
  const [userName, setUserName] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    // Check for saved session
    const savedSession = localStorage.getItem("familySafetySession")
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        setCurrentUser(session.currentUser)
        setCurrentFamily(session.currentFamily)
        setIsLocationSharing(session.isLocationSharing)

        if (session.currentFamily) {
          fetchFamilyData(session.currentFamily)
        }

        if (session.isLocationSharing) {
          startLocationSharing()
        }
      } catch (error) {
        console.error("Error restoring session:", error)
        localStorage.removeItem("familySafetySession")
      }
    }
  }, [])

  const saveSession = () => {
    const session = {
      currentUser,
      currentFamily,
      isLocationSharing,
    }
    localStorage.setItem("familySafetySession", JSON.stringify(session))
  }

  const fetchFamilyData = async (familyName: string) => {
    try {
      const response = await fetch(`/api/families/${familyName}`)
      if (response.ok) {
        const data = await response.json()
        setFamilyData(data)
      }
    } catch (error) {
      console.error("Error fetching family data:", error)
    }
  }

  const joinFamily = async () => {
    if (!familyName || !password || !userName) {
      setError("Please fill in all fields")
      return
    }

    try {
      const response = await fetch("/api/families/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: familyName.toLowerCase(),
          password,
          userName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentUser(userName)
        setCurrentFamily(familyName.toLowerCase())
        setFamilyData(data.family)
        saveSession()
        setSuccess("Successfully joined family!")
        setError("")
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const createFamily = async () => {
    if (!familyName || !password || !userName) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    try {
      const response = await fetch("/api/families/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: familyName.toLowerCase(),
          password,
          userName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCurrentUser(userName)
        setCurrentFamily(familyName.toLowerCase())
        setFamilyData(data.family)
        saveSession()
        setSuccess("Family created successfully! Share the family name and password with your family members.")
        setError("")
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError("Network error. Please try again.")
    }
  }

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          timestamp: new Date().toISOString(),
        }

        // Update location on server
        try {
          await fetch("/api/families/update-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              familyName: currentFamily,
              userName: currentUser,
              location,
            }),
          })

          setIsLocationSharing(true)
          saveSession()

          // Refresh family data
          if (currentFamily) {
            fetchFamilyData(currentFamily)
          }
        } catch (error) {
          console.error("Error updating location:", error)
        }
      },
      (error) => {
        setError("Unable to get your location: " + error.message)
      },
      options,
    )

    setWatchId(id)
  }

  const stopLocationSharing = async () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    setIsLocationSharing(false)

    // Remove location from server
    try {
      await fetch("/api/families/remove-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyName: currentFamily,
          userName: currentUser,
        }),
      })

      saveSession()

      // Refresh family data
      if (currentFamily) {
        fetchFamilyData(currentFamily)
      }
    } catch (error) {
      console.error("Error removing location:", error)
    }
  }

  const leaveFamily = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    localStorage.removeItem("familySafetySession")
    setCurrentUser(null)
    setCurrentFamily(null)
    setIsLocationSharing(false)
    setFamilyData(null)
    setFamilyName("")
    setUserName("")
    setPassword("")
    setSuccess("Left family successfully")
  }

  // Auto-refresh family data
  useEffect(() => {
    if (currentFamily) {
      const interval = setInterval(() => {
        fetchFamilyData(currentFamily)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [currentFamily])

  if (!currentUser || !currentFamily) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50">
        <div className="container max-w-4xl mx-auto p-5">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Family Safety
            </h1>
            <p className="text-lg text-slate-300">Keep your family connected and safe</p>
          </div>

          <div className="max-w-md mx-auto bg-slate-800 border border-slate-600 rounded-2xl p-7 shadow-2xl">
            <h2 className="text-center text-xl font-semibold mb-6">Family Account Access</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Family Name:</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Enter your family name"
                  className="w-full p-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-slate-50 focus:border-indigo-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Your Name:</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-slate-50 focus:border-indigo-400 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Family Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter family password"
                  className="w-full p-3 bg-slate-900 border-2 border-slate-600 rounded-xl text-slate-50 focus:border-indigo-400 focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={joinFamily}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 mb-3"
              >
                Join Existing Family
              </button>

              <button
                onClick={createFamily}
                className="w-full bg-slate-600 text-slate-50 p-3 rounded-xl font-semibold hover:bg-slate-500 transition-colors"
              >
                Create New Family
              </button>

              {error && (
                <div className="text-red-400 text-sm p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-400 text-sm p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
                  {success}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <div className="container max-w-4xl mx-auto p-5">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Family Safety
          </h1>
          <p className="text-lg text-slate-300">Keep your family connected and safe</p>
        </div>

        <div className="bg-slate-800 border border-slate-600 rounded-2xl p-7 shadow-2xl mb-6">
          <h2 className="text-2xl font-semibold mb-6">Family Dashboard</h2>

          {!isLocationSharing ? (
            <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Location Sharing Permission</h3>
              <p className="text-slate-300 mb-4 leading-relaxed">
                To keep your family safe, we need permission to access your location. This allows family members to see
                where you are and helps in emergency situations.
              </p>
              <button
                onClick={startLocationSharing}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
              >
                Enable Location Sharing
              </button>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <strong className="text-green-400">Location sharing is active</strong>
              <br />
              <span className="text-slate-300">Your family can see your location and you can see theirs.</span>
              <button
                onClick={stopLocationSharing}
                className="ml-4 bg-slate-600 text-slate-50 px-4 py-2 rounded-lg text-sm hover:bg-slate-500 transition-colors"
              >
                Stop Sharing
              </button>
            </div>
          )}

          {familyData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {familyData.members.map((member) => {
                const isCurrentUser = member.name === currentUser
                return (
                  <div
                    key={member.id}
                    className={`rounded-2xl p-6 border-l-4 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl ${
                      isCurrentUser
                        ? "bg-gradient-to-br from-slate-800 to-slate-700 border-indigo-400 border border-indigo-400"
                        : "bg-slate-800 border-slate-600 border"
                    }`}
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-slate-50 mb-3">
                        {member.name}
                        {isCurrentUser ? " (You)" : ""}
                      </h3>
                      <div className="flex items-center mb-3">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 shadow-sm ${
                            member.isOnline ? "bg-green-400 shadow-green-400/30" : "bg-red-400 shadow-red-400/30"
                          }`}
                        />
                        <span className="text-slate-300">{member.isOnline ? "Sharing location" : "Offline"}</span>
                      </div>
                      {member.location && <p className="text-slate-400 text-sm mb-4">{member.location.address}</p>}
                    </div>

                    {member.location ? (
                      <FamilyMap location={member.location} memberName={member.name} />
                    ) : (
                      <div className="h-80 bg-slate-900 border border-slate-600 rounded-xl flex items-center justify-center">
                        <p className="text-slate-400">Location not available</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={leaveFamily}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
          >
            Leave Family Network
          </button>
        </div>
      </div>
    </div>
  )
}
