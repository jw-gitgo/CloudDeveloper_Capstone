import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { CreateTripRequest } from '../../requests/CreateTripRequest';
import * as uuid from 'uuid';
import { decode } from 'jsonwebtoken';
import { JwtPayload } from '../../auth/JwtPayload';
import * as AWS from 'aws-sdk'
import { createLogger } from '../../utils/logger';
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

  const tripId = uuid.v4();
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const decodedJwt = decode(jwtToken) as JwtPayload
  const userId = decodedJwt.sub;
  const createdAt = new Date(Date.now()).toISOString();
  

  const tripItem = {
    userId,
    tripId,
    createdAt,
    done: false,
    attachmentUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${tripId}`,
    ...newTrip
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