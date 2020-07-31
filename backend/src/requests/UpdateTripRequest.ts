/**
 * Fields in a request to update a single TRIP item.
 */
export interface UpdateTripRequest {
  name: string
  startPoint: string
  endPoint: string
}