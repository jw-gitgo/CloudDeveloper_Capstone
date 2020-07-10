import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { decode } from 'jsonwebtoken';
import { JwtPayload } from '../../auth/JwtPayload';
import { createLogger } from '../../utils/logger';
const logger = createLogger('deleteTodo');

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info('Deleting event: ', event)

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const decodedJwt = decode(jwtToken) as JwtPayload
  const userId = decodedJwt.sub;

  // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object

  //perform the update
  const deleteSuccess = await docClient.delete({
    TableName: todosTable,
    Key: {
      todoId,
      userId
    }
  }).promise();

  // Check if todo already exists
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