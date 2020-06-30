import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import * as AWS from 'aws-sdk'
//import { verify, decode } from 'jsonwebtoken'
import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
//import Axios from 'axios'
//import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const secretId = process.env.AUTH_0_SECRET_ID
const secretField = process.env.AUTH_0_SECRET_FIELD

const client = new AWS.SecretsManager()
let cachedSecret: string

const logger = createLogger('auth')

//const jwksUrl = 'https://test-endpoint.auth0.com/.well-known/jwks.json'


export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  //const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  const secretObject: any = await getSecret()
  const secret = secretObject(secretField)
  return verify(token, secret) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

async function getSecret(){
  if (cachedSecret) return cachedSecret

  const data = await client
    .getSecretValue({
      SecretId: secretId
    })
    .promise()

  cachedSecret = data.SecretString

  return JSON.parse(cachedSecret)
}