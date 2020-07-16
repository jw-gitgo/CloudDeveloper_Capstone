import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
import { decode } from 'jsonwebtoken';
import Axios from 'axios';
import { JwtPayload } from '../../auth/JwtPayload';
import * as AWS from 'aws-sdk'
import { createLogger } from '../../utils/logger';
const logger = createLogger('getTrips');

const docClient = new AWS.DynamoDB.DocumentClient()
const tripsTable = process.env.TRIPS_TABLE
const indexName = process.env.INDEX_NAME
const routeAPIKey = process.env.ROUTE_API_KEY
const routeAPIUrl = 'https://api.openrouteservice.org/geocode/search?api_key=';
const regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;

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

///////////////////////////////////////////////

  items.forEach(async function(item) {
    var cleanedStart1 = item.startPoint.replace(regex, '');
    var cleanedStart2 = cleanedStart1.replace(' ', '%20');
    item.startGeo = await getCoordinates(cleanedStart2);
  });


  Axios.get('https://api.openrouteservice.org/geocode/search?api_key='+routeAPIKey+'&text=Namibian%20Brewery')
  .then(response => {
    console.log(response.data.url);
    console.log(response.data.explanation);
  })
  .catch(error => {
    console.log(error);
  });
  

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

async function getCoordinates (cleanedStart2: string): Promise<string> {
  const location = await Axios.get(routeAPIUrl+routeAPIKey+'&text='+cleanedStart2);
  return location.data.features.geometry.coordinates;
}