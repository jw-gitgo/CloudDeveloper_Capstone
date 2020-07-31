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
      +weatherAPIKey+'&units=imperial')).data.hourly[0];
    console.log("wt0: ", wt0);
    console.log("Math.round(t1): ", Math.round(t1));
    const wt1 = (await Axios.get(weatherAPIUrl+pt1[1]+'&lon='+pt1[0]+'&exclude=minutely,daily&appid='
      +weatherAPIKey+'&units=imperial')).data.hourly[Math.round(t1)];
    const wt2 = (await Axios.get(weatherAPIUrl+pt2[1]+'&lon='+pt2[0]+'&exclude=minutely,daily&appid='
    +weatherAPIKey+'&units=imperial')).data.hourly[Math.round(t2)];
    const wt3 = (await Axios.get(weatherAPIUrl+pt3[1]+'&lon='+pt3[0]+'&exclude=minutely,daily&appid='
    +weatherAPIKey+'&units=imperial')).data.hourly[Math.round(t3)];
    const wt4 = (await Axios.get(weatherAPIUrl+pt4[1]+'&lon='+pt4[0]+'&exclude=minutely,daily&appid='
    +weatherAPIKey+'&units=imperial')).data.hourly[Math.round(parseFloat(duration))];

    const desc0 = wt0.weather[0].description;
    const desc1 = wt1.weather[0].description;
    const desc2 = wt2.weather[0].description;
    const desc3 = wt3.weather[0].description;
    const desc4 = wt4.weather[0].description;

    const temp0 = wt0.temp;
    const temp1 = wt1.temp;
    const temp2 = wt2.temp;
    const temp3 = wt3.temp;
    const temp4 = wt4.temp;

    const vis0 = wt0.visibility;
    const vis1 = wt1.visibility;
    const vis2 = wt2.visibility;
    const vis3 = wt3.visibility;
    const vis4 = wt4.visibility;

    const wind0 = wt0.wind_speed;
    const wind1 = wt1.wind_speed;
    const wind2 = wt2.wind_speed;
    const wind3 = wt3.wind_speed;
    const wind4 = wt4.wind_speed;

    return '{ Start, '+desc0+', '+temp0+' deg, '+vis0+' ft visibility, '+wind0+' mph wind } { '
    +t1.toFixed(2)+' hrs, '+desc1+', '+temp1+' deg, '+vis1+' ft visibility, '+wind1+' mph wind } { '
    +t2.toFixed(2)+' hrs, '+desc2+', '+temp2+' deg, '+vis2+' ft visibility, '+wind2+' mph wind } { '
    +t3.toFixed(2)+' hrs, '+desc3+', '+temp3+' deg, '+vis3+' ft visibility, '+wind3+' mph wind } { End: '
    +parseFloat(duration).toFixed(2)+' hrs, '+desc4+', '+temp4+' deg, '+vis4+' ft visibility, '+wind4+' mph wind }'

  }