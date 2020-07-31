import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
import { decode } from 'jsonwebtoken';
import { JwtPayload } from '../../auth/JwtPayload';
import * as AWS from 'aws-sdk'
import { createLogger } from '../../utils/logger';
const logger = createLogger('getTrips');

const docClient = new AWS.DynamoDB.DocumentClient()
const tripsTable = process.env.TRIPS_TABLE
const indexName = process.env.INDEX_NAME

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  
  logger.info('processing event: ', event)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const decodedJwt = decode(jwtToken) as JwtPayload
  const userId = decodedJwt.sub;

  const result = await docClient.query({
    TableName: tripsTable,
    IndexName: indexName,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  }).promise();

  const items = result.Items;

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items: items
    })
  };
}