import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { CreateTodoRequest } from '../../requests/CreateTodoRequest';
import * as uuid from 'uuid';
import { decode } from 'jsonwebtoken';
import { JwtPayload } from '../../auth/JwtPayload';
import * as AWS from 'aws-sdk'
import { createLogger } from '../../utils/logger';
const logger = createLogger('createTodo');

const docClient = new AWS.DynamoDB.DocumentClient()
const todosTable = process.env.TODOS_TABLE

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body);
  logger.info('Creating event: ', event)

  if (!newTodo.name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'name is empty'
      })
    };
  }

  const todoId = uuid.v4();
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]
  const decodedJwt = decode(jwtToken) as JwtPayload
  const userId = decodedJwt.sub;
  const createdAt = new Date(Date.now()).toISOString();
  

  const todoItem = {
    userId,
    todoId,
    createdAt,
    done: false,
    attachmentUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${todoId}`,
    ...newTodo
  };

  await docClient.put({
    TableName: todosTable,
    Item: todoItem
  }).promise();

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: todoItem
    })
  };
}