// hello.ts

import { parseBusinessData, parseCategoryData, parseDynamoData } from './data/dataParser.ts'
import { getDynamoItem, putDynamoItem, yelpApiRequest } from './data/dataRetriever.ts'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Application,
  ctx,
  getQuery,
  isHttpError,
  oakCors,
  Router,
  ServerRequest,
  ServerResponse
} from './deps.ts'
import {
  queryObjectToString,
  responseBuilder
} from './utility/helper.ts'
import { Logger } from './utility/logger.ts'

const logger = new Logger({ level: 0, format: 'APP::%s' })
const router = new Router()
const app = new Application()

const BAD_REQUEST = 400
const CACHE = {
  warmUpStatus: false
}

router
  .get('/v1/business', async (context: ctx) => {
    try {
      const query = getQuery(context)
      const location = query?.location
        ? [...query?.location.matchAll(/^[A-Za-z]+,[ ]?[A-Za-z]{2}$/g)]
        : []
      const latitude = query?.lat
        ? [...query?.lat.matchAll(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/g)]
        : []
      const longitude = query?.long
        ? [...query?.long.matchAll(/^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/g)]
        : []

      const searchQuery = latitude?.[0]?.[0] && longitude?.[0]?.[0]
        ? `latitude: ${latitude[0][0]}, longitude: ${longitude[0][0]}`
        : location?.[0]?.[0]
          ? `location: "${location[0][0]}"`
          : null

      if (!searchQuery) {
        context.response.status = BAD_REQUEST
        context.response.body = 'Either a bad city and state or latitude and longitude were used.'
      } else {
        logger.info('%s%s%s Starting dynamodb get request\n', 'APP::', 'BUSINESS::', 'INFO:')
        const dbResponse = await getDynamoItem(searchQuery.toLowerCase())
        logger.info('%s%s%s Parsing dynamodb response\n', 'APP::', 'BUSINESS::', 'INFO:')
        const parsedDbResponse = parseDynamoData(dbResponse, 'hours')
        if (parsedDbResponse) {
          logger.info('%s%s%s Sending db data\n', 'APP::', 'BUSINESS::', 'INFO:')
          context.response.body = parsedDbResponse
        } else {
          logger.info('%s%s%s Starting yelp request\n', 'APP::', 'BUSINESS::', 'INFO:')
          const yelpResponse = await yelpApiRequest(
            'https://api.yelp.com/v3/graphql',
            `{
              search(term: "black owned", ${searchQuery}, limit: 50, locale: "en_US") {
                total
                business {
                  id
                  name
                  alias
                  url
                  photos
                  phone
                  display_phone
                  distance
                  categories {
                    alias
                    title
                    parent_categories {
                      alias
                    }
                  }
                  location {
                    address1
                    address2
                    formatted_address
                  }
                  coordinates {
                    latitude
                    longitude
                  }
                  is_closed
                  hours {
                    hours_type
                    open {
                      is_overnight
                      end
                      start
                      day
                    }
                  }
                }
              }
            }`
          )

          logger.info('%s%s%s Parsing yelp response\n', 'APP::', 'BUSINESS::', 'INFO:')
          const parsedBusinessData = parseBusinessData(yelpResponse, 'search')
          logger.info('%s%s%s Starting dynamodb put request\n', 'APP::', 'BUSINESS::', 'INFO:')
          await putDynamoItem(searchQuery.toLowerCase(), parsedBusinessData)
          logger.info('%s%s%s Returning response\n', 'APP::', 'BUSINESS::', 'INFO:')
          context.response.body = parsedBusinessData
        }
      }
    } catch (err) {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'BUSINESS::', 'ERROR:')
      context.response.status = BAD_REQUEST
      context.response.body = err.message
    }
  })
  .get('/v1/category', async (context: ctx) => {
    try {
      const dbKey = 'category'
      logger.info('%s%s%s Starting dynamodb get request\n', 'APP::', 'CATEGORY::', 'INFO:')
      const dbResponse = await getDynamoItem(dbKey)
      logger.info('%s%s%s Parsing dynamodb response\n', 'APP::', 'CATEGORY::', 'INFO:')
      const parsedDbResponse = parseDynamoData(dbResponse, 'days')
      if (parsedDbResponse) {
        logger.info('%s%s%s Sending db data\n', 'APP::', 'CATEGORY::', 'INFO:')
        context.response.body = parsedDbResponse
      } else {
        logger.info('%s%s%s Starting yelp request\n', 'APP::', 'CATEGORY::', 'INFO:')
        const yelpResponse = await yelpApiRequest(
          'https://api.yelp.com/v3/graphql',
          `{
            categories(country: "US", locale: "en_US") {
              category {
                alias
                title
                parent_categories {
                  alias
                }
              }
              total
            }
          }`
        )

        logger.info('%s%s%s Parsing Yelp response\n', 'APP::', 'CATEGORY::', 'INFO:')
        const parsedCategoryData = parseCategoryData(yelpResponse, 'categories')
        logger.info('%s%s%s Starting dynamodb put request\n', 'APP::', 'CATEGORY::', 'INFO:')
        await putDynamoItem(dbKey, parsedCategoryData)
        logger.info('%s%s%s Returning response\n', 'APP::', 'CATEGORY::', 'INFO:')
        context.response.body = parsedCategoryData
      }
    } catch (err) {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'CATEGORY::', 'ERROR:')
      context.response.status = BAD_REQUEST
      context.response.body = err.message
    }
  })
  .get('/v1/warmUp', async (context: ctx) => {
    try {
      const status = {
        warmedUp: false,
        alreadyWarm: false
      }
      if (CACHE.warmUpStatus === true) {
        status.alreadyWarm = true
      } else {
        CACHE.warmUpStatus = true
      }
      status.warmedUp = CACHE.warmUpStatus
      logger.info(`%s%s ${JSON.stringify(status)}\n`, 'APP::', 'INFO:')
      context.response.body = status
    } catch (err) {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'ERROR:')
      context.response.status = BAD_REQUEST
      context.response.body = err.message
    }
  })
  .get('/v1/error', async (context: ctx) => {
    try {
      throw new Error('uh oh')
    } catch (err) {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'ERROR:')
      context.response.status = BAD_REQUEST
      context.response.body = err.message
    }
  })

// Error handler
app.use(async (context: ctx, next: any) => {
  try {
    await next()
  } catch (err) {
    if (isHttpError(err)) {
      context.response.status = err.status
      const { message, status, stack } = err
      if (context.request.accepts('json')) {
        context.response.body = { message, status, stack }
        context.response.type = 'json'
      } else {
        context.response.body = `${status} ${message}\n\n${stack ?? ''}`
        context.response.type = 'text/plain'
      }
    } else {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'HANDLER::', 'ERROR:')
      throw err
    }
  }
})

app.use(oakCors({ origin: true }))
app.use(router.routes())
// app.use(router.allowedMethods())

async function appTranslator( request: any): Promise<APIGatewayProxyResult> {
  const context = new ServerRequest()
  context.headers = new Headers()
  for (const header in request.headers) {
    context.headers.set(header, request.headers[header])
  }
  context.proto = 'http'
  context.method = request.httpMethod ?? null
  const query = request.queryStringParameters
    ? '?' + queryObjectToString(request.queryStringParameters)
    : ''
  context.url = `${request.path}${query}` ?? null

  const routerResponse = await app.handle(context) as ServerResponse

  return await responseBuilder(routerResponse)
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
   const appResponse = await appTranslator(event)
   return appResponse
}
