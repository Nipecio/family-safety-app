"use client"

import { useEffect, useRef } from "react"

interface Location {
  lat: number
  lng: number
  address: string
  timestamp: string
}

interface FamilyMapProps {
  location: Location
  memberName: string
}

export default function FamilyMap({ location, memberName }: FamilyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || !location) return

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      // Create new map
      const map = L.map(mapRef.current, {
        center: [location.lat, location.lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      // Add marker
      L.marker([location.lat, location.lng])
        .addTo(map)
        .bindPopup(`<strong>${memberName}</strong><br>${location.address}`)

      mapInstanceRef.current = map

      // Force resize after a short delay
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [location, memberName])

  return (
    <div
      ref={mapRef}
      className="h-80 bg-slate-900 border border-slate-600 rounded-xl overflow-hidden"
      style={{ height: "320px", width: "100%" }}
    />
  )
}
