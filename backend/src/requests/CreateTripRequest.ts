/**
 * Fields in a request to create a single TRIP item.
 */
export interface CreateTripRequest {
  name: string
  startPoint: string
  endPoint: string
}
