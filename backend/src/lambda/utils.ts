import { APIGatewayProxyEvent } from "aws-lambda";
import { parseUserId } from "../auth/utils";
import Axios from 'axios';

const routeAPIKey = process.env.ROUTE_API_KEY
const weatherAPIKey = process.env.WEATHER_API_KEY
const geoAPIUrl = 'https://api.openrouteservice.org/geocode/search?api_key=';
const routeAPIUrl = 'https://api.openrouteservice.org/v2/directions/driving-car?api_key=';
const weatherAPIUrl = 'https://api.openweathermap.org/data/2.5/onecall?lat=';
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
  const cleanedLoc = location.replace(regex, '').replace(' ', '%20');
  const routing = await Axios.get(geoAPIUrl+routeAPIKey+'&text='+cleanedLoc);
  const geoLoc = JSON.stringify(routing.data.features[0].geometry.coordinates).replace(coordsRegex, '');
  return geoLoc;
}

export async function getRoute(startGeo: string, endGeo: string): Promise<string> {
  const routing = await Axios.get(routeAPIUrl+routeAPIKey+'&start='+startGeo+'&end='+endGeo);
  const route = JSON.stringify(routing.data.features[0]);
  return route;
}

export async function getWeather(startGeo: string, quarterGeo: string, halfGeo, 
  threequarterGeo: string, endGeo: string, duration: string): Promise<string> {
    const pt0 = startGeo.split(',');
    const pt1 = quarterGeo.split(',');
    const pt2 = halfGeo.split(',');
    const pt3 = threequarterGeo.split(',');
    const pt4 = endGeo.split(',');

    const t1 = parseFloat(duration)/4;
    const t2 = parseFloat(duration)/2;
    const t3 = parseFloat(duration)*3/4;

    console.log(weatherAPIUrl+pt0[1]+'&lon='+pt0[0]+'&exclude=minutely,daily&appid='+weatherAPIKey+'&units=imperial')
    const wt0 = (await Axios.get(weatherAPIUrl+pt0[1]+'&lon='+pt0[0]+'&exclude=minutely,daily&appid='
      +weatherAPIKey+'&units=imperial')).data.hourly.weather[0].main;
    const wt1 = (await Axios.get(weatherAPIUrl+pt1[1]+'&lon='+pt1[0]+'&exclude=minutely,daily&appid='
      +weatherAPIKey+'&units=imperial')).data.hourly.weather[Math.round(t1)].main;
    const wt2 = (await Axios.get(weatherAPIUrl+pt2[1]+'&lon='+pt2[0]+'&exclude=minutely,daily&appid='
    +weatherAPIKey+'&units=imperial')).data.hourly.weather[Math.round(t2)].main;
    const wt3 = (await Axios.get(weatherAPIUrl+pt3[1]+'&lon='+pt3[0]+'&exclude=minutely,daily&appid='
    +weatherAPIKey+'&units=imperial')).data.hourly.weather[Math.round(t3)].main;
    const wt4 = (await Axios.get(weatherAPIUrl+pt4[1]+'&lon='+pt4[0]+'&exclude=minutely,daily&appid='
    +weatherAPIKey+'&units=imperial')).data.hourly.weather[Math.round(parseFloat(duration))].main;

    return '{ Start, '+wt0+' } { '+t1.toFixed(2)+' hrs, '+wt1+' } { '+t2.toFixed(2)+' hrs, '+wt2+
    ' } { '+t3.toFixed(2)+' hrs, '+wt3+' } { End: '+parseFloat(duration).toFixed(2)+' hrs, '+wt4+' }'

  }