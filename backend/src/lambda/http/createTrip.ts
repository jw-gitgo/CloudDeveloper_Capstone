import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { CreateTripRequest } from '../../requests/CreateTripRequest';
import * as uuid from 'uuid';
import { decode } from 'jsonwebtoken';
import { JwtPayload } from '../../auth/JwtPayload';
import * as AWS from 'aws-sdk'
import { createLogger } from '../../utils/logger';
import { getCoordinates, getRoute } from '../utils'
const logger = createLogger('createTrip');

const docClient = new AWS.DynamoDB.DocumentClient()
const tripsTable = process.env.TRIPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTrip: CreateTripRequest = JSON.parse(event.body);
  logger.info('Creating event: ', event)

  if (!newTrip.name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'name is empty'
      })
    };
  }
  if (!newTrip.startPoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'starting location is empty'
      })
    };
  }
  if (!newTrip.endPoint) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'ending location is empty'
      })
    };
  }

  const tripId = uuid.v4();
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const decodedJwt = decode(jwtToken) as JwtPayload
  const userId = decodedJwt.sub;
  const createdAt = new Date(Date.now()).toISOString();
  const startGeo = await getCoordinates(newTrip.startPoint);
  const endGeo = await getCoordinates(newTrip.endPoint);
  const route = JSON.parse(await getRoute(startGeo,endGeo));
  const distance = parseFloat(route.properties.segments[0].distance)/1609;
  const duration = parseFloat(route.properties.segments[0].duration)/3600;

  

  const tripItem = {
    userId,
    tripId,
    createdAt,
    tripIconUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${tripId}`,
    ...newTrip,
    startGeo,
    endGeo,
    distance,
    duration
  };

  await docClient.put({
    TableName: tripsTable,
    Item: tripItem
  }).promise();

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: tripItem
    })
  };
}