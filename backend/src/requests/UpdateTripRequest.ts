/**
 * Fields in a request to update a single TRIP item.
 */
export interface UpdateTripRequest {
  name: string
  dueDate: string
  done: boolean
}