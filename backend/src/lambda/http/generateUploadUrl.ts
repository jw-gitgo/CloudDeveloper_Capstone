import 'source-map-support/register'
import * as AWS from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'

import { createLogger } from '../../utils/logger';
const logger = createLogger('generateUploadUrl');

const s3_bucket = process.env.S3_BUCKET

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info('User was authorized', event)
  // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
  // INITIAL ATTEMPT BELOW, based on 4.2.3

  const s3 = new AWS.S3({
    signatureVersion: 'v4' // Use Sigv4 algorithm
  })
  const presignedUrl = s3.getSignedUrl('putObject', { // The URL will allow to perform the PUT operation
    Bucket: s3_bucket, // Name of an S3 bucket
    Key: todoId, // id of an object this URL allows access to
    Expires: '300'  // A URL is only valid for 5 minutes
  })

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl: presignedUrl
    })
  }
}
