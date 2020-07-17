import { APIGatewayProxyEvent } from "aws-lambda";
import { parseUserId } from "../auth/utils";
import Axios from 'axios';

const routeAPIKey = process.env.ROUTE_API_KEY
const routeAPIUrl = 'https://api.openrouteservice.org/geocode/search?api_key=';
const regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
const coordsRegex = /[!"#$%&'()*+/:;<=>?@[\]^_`{|}~]/g;

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

export async function getCoordinates(location: string): Promise<string> {
  const cleanedLoc1 = location.replace(regex, '');
  const cleanedLoc2 = cleanedLoc1.replace(' ', '%20');
  const routing = await Axios.get(routeAPIUrl+routeAPIKey+'&text='+cleanedLoc2);
  const geoLoc = JSON.stringify(routing.data.features[0].geometry.coordinates).replace(coordsRegex, '');
  return geoLoc;
}

export async function getDistance(startGeo: string, endGeo: string): Promise<string> {
  console.log(routeAPIUrl+routeAPIKey+'&start='+startGeo+'&end='+endGeo);
  const routing = await Axios.get(routeAPIUrl+routeAPIKey+'&start='+startGeo+'&end='+endGeo);
  const distance = routing.data.features[0].properties.segments[0].distance;
  return distance;
}