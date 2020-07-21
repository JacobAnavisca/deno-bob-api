import { soxa } from 'https://deno.land/x/soxa/mod.ts'
import { config } from "https://deno.land/x/dotenv/mod.ts"
import { Logger } from '../utility/logger.ts'

const logger = new Logger({ level: 0, format: "RETRIEVER::%s" })

async function yelpApiRequest(
  url: string,
  content?: any,
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${config().YELP_API_KEY}`,
        'Content-Type':'application/graphql'
      },
    }

    return soxa.post(url, content, requestOptions)
        .then(function (response) {
          resolve(response)
          logger.info('%s%s: Yelp request succeeded\n', 'RETRIEVER::', 'INFO')
        })
        .catch(function (error) {
          reject(error)
          logger.error('%s%s: Yelp request failed\n', 'RETRIEVER::', 'ERROR')
        })  
  })
}

export { yelpApiRequest }