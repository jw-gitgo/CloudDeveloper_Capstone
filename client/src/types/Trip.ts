export interface Trip {
  userId: string
  tripId: string
  createdAt: string
  updatedAt: string
  name: string
  startPoint: string
  startGeo: string
  endPoint: string
  endGeo: string
  distance: string
  duration: string
  steps: string
  weather: string
  tripIconUrl: string
}
