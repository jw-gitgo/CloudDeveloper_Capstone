import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { decode } from 'jsonwebtoken';
import { JwtPayload } from '../../auth/JwtPayload';
import { createLogger } from '../../utils/logger';
const logger = createLogger('deleteTrip');

const docClient = new AWS.DynamoDB.DocumentClient()
const tripsTable = process.env.TRIPS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const tripId = event.pathParameters.tripId
  logger.info('Deleting event: ', event)

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const decodedJwt = decode(jwtToken) as JwtPayload
  const userId = decodedJwt.sub;

  // TRIP: Update a TRIP item with the provided id using values in the "updatedTrip" object

  //perform the update
  const deleteSuccess = await docClient.delete({
    TableName: tripsTable,
    Key: {
      tripId,
      userId
    }
  }).promise();

  // Check if trip already exists
  if (!(deleteSuccess)) {
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
      deleteSuccess
    })
  }
}