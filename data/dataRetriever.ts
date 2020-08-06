import {
  config,
  createClient,
  createHash,
  DynamoDBClient,
  moment,
  soxa
} from '../deps.ts'
import { Logger } from '../utility/logger.ts'

const logger = new Logger({ level: 0, format: 'RETRIEVER::%s' })

const ENV_PATH = `./.env.${Deno.env.get('STAGE')}`
const TABLE_NAME = config({ path: ENV_PATH }).DB_TABLE
const AWS_ACCESS_KEY_ID = config({ path: ENV_PATH }).AWS_ACCESS_KEY_ID
const AWS_ACCESS_KEY = config({ path: ENV_PATH }).AWS_ACCESS_KEY
const REGION = config({ path: ENV_PATH }).REGION

const dyno: DynamoDBClient = createClient(
  {
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_ACCESS_KEY
    },
    region: REGION
  }
)

async function yelpApiRequest(
  url: string,
  content?: any,
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const yelpApiKey = config({ path: ENV_PATH }).YELP_API_KEY
    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${yelpApiKey}`,
        'Content-Type': 'application/graphql'
      },
    }

    return soxa.post(url, content, requestOptions)
        .then((response: any) => {
          resolve(response)
          logger.info('%s%s Yelp request succeeded\n', 'RETRIEVER::', 'INFO:')
        })
        .catch((error: any) => {
          reject(error)
          logger.error('%s%s Yelp request failed\n', 'RETRIEVER::', 'ERROR:')
        })
  })
}

async function getDynamoItem( key: string ): Promise<any> {
  const hash = createHash('md5')
  hash.update(key)
  const hashKey = hash.toString('base64')

  const result = await dyno.getItem({
      TableName: TABLE_NAME,
      Key: { YelpID: hashKey }
    })

  return result
}

async function putDynamoItem( key: string, data: any ): Promise<any> {
  const hash = createHash('md5')
  hash.update(key)
  const hashKey = hash.toString('base64')

  const result = await dyno.putItem({
      TableName: TABLE_NAME,
      Item: { YelpID: hashKey, data: JSON.stringify(data), timestamp: moment().toISOString() }
    })

  return result
}

export { yelpApiRequest, getDynamoItem, putDynamoItem }
