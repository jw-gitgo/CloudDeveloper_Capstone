import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTripRequest } from '../../requests/UpdateTripRequest'
import { decode } from 'jsonwebtoken';
import { JwtPayload } from '../../auth/JwtPayload';
import { getCoordinates, getRoute, getWeather } from '../utils'

import { createLogger } from '../../utils/logger';
const logger = createLogger('updateTrip');

const coordsRegex = /[!"#$%&'()*+/:;<=>?@[\]^_`{|}~]/g;

const docClient = new AWS.DynamoDB.DocumentClient()
const tripsTable = process.env.TRIPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Updating event: ', event)
  const tripId = event.pathParameters.tripId
  const updatedTrip: UpdateTripRequest = JSON.parse(event.body)

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const decodedJwt = decode(jwtToken) as JwtPayload
  const userId = decodedJwt.sub;

  const startGeo = await getCoordinates(updatedTrip.startPoint);
  const endGeo = await getCoordinates(updatedTrip.endPoint);
  const route = JSON.parse(await getRoute(startGeo,endGeo));
  const distance = (parseFloat(route.properties.segments[0].distance)/1609).toFixed(2);
  const duration = (parseFloat(route.properties.segments[0].duration)/3600).toFixed(2);
  const steps = route.properties.segments[0].steps;

  const wayPointCount = route.properties.way_points[1];
  console.log("wayPointCount: ", wayPointCount);
  console.log("first waypoint: ", route.geometry.coordinates[0]);
  console.log("quarter waypoint:  ", Math.round(wayPointCount/4));
  console.log("quarterGeo should be: ", route.geometry.coordinates[951]);
  const quarterGeo = JSON.stringify(route.geometry.coordinates[Math.round(wayPointCount/4)]).replace(coordsRegex, '');
  console.log("quarterGeo: ", quarterGeo);
  const halfGeo = JSON.stringify(route.geometry.coordinates[Math.round(wayPointCount/2)]).replace(coordsRegex, '');
  console.log("halfGeo: ", halfGeo);
  const threequarterGeo = JSON.stringify(route.geometry.coordinates[Math.round(wayPointCount*3/4)]).replace(coordsRegex, '');
  console.log("threequarterGeo: ", threequarterGeo);

  const weather = await getWeather(startGeo, quarterGeo, halfGeo, threequarterGeo, endGeo, duration);
  console.log("weather: ", weather);

  // TRIP: Update a TRIP item with the provided id using values in the "updatedTrip" object

  //perform the update
  const updateSuccess = await docClient.update({
    TableName: tripsTable,
    Key: {
      tripId,
      userId
    },
    UpdateExpression: 'set #name = :n, #startPoint = :start, #endPoint = :end, #startGeo = :SG, #endGeo = :EG, #distance = :Dist, #duration = :Dur, #weather = :W, #steps = :S',
    ExpressionAttributeValues: {
      ':n': updatedTrip.name,
      ':start': updatedTrip.startPoint,
      ':end': updatedTrip.endPoint,
      ':SG': startGeo,
      ':EG': endGeo,
      ':Dist': distance,
      ':Dur': duration,
      ':W': weather,
      ':S': steps
    },
    ExpressionAttributeNames: {
      '#name': 'name',
      '#startPoint': 'startPoint',
      '#endPoint': 'endPoint',
      '#startGeo': 'startGeo',
      '#endGeo': 'endGeo',
      '#distance': 'distance',
      '#duration': 'duration',
      '#weather': 'weather',
      '#steps': 'steps'
    }
  }).promise();

  // Check if trip already exists
  if (!(updateSuccess)) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Item does not exist'
      })
    };
  }
  
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      updatedTrip
    })
  }
}
