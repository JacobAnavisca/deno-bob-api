import {
  config,
  soxa
} from '../deps.ts'
import { Logger } from '../utility/logger.ts'

const logger = new Logger({ level: 0, format: 'RETRIEVER::%s' })

async function yelpApiRequest(
  url: string,
  content?: any,
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const envPath = `./.env.${Deno.env.get('STAGE')}`
    const yelpApiKey = config({ path: envPath }).YELP_API_KEY
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

export { yelpApiRequest }
