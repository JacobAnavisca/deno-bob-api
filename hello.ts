// hello.ts

import { parseBusinessData, parseCategoryData } from './data/dataParser.ts'
import { yelpApiRequest } from './data/dataRetriever.ts'
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Application,
  Context,
  ctx,
  getQuery,
  isHttpError,
  Router,
  ServerRequest,
  ServerResponse
} from './deps.ts'
import {
  decodeBody,
  queryObjectToString,
  responseBuilder
} from './utility/helper.ts'
import { Logger } from './utility/logger.ts'

const logger = new Logger({ level: 0, format: 'APP::%s' })
const router = new Router()
const app = new Application()
const CACHE = {
  warmUpStatus: false
}

router
  .get('/v1/business', async (context: ctx) => {
    try {
      const query = getQuery(context)
      const location = query.location

      logger.info('%s%s%s Starting yelp request\n', 'APP::', 'BUSINESS::', 'INFO:')
      const yelpResponse = await yelpApiRequest(
        'https://api.yelp.com/v3/graphql',
        `{
          search(term: "black owned", location: "${location}", limit: 50, locale: "en_US") {
            total
            business {
              id
              name
              alias
              url
              phone
              display_phone
              location {
                address1
                address2
                formatted_address
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

      logger.info('%s%s%s Returning response\n', 'APP::', 'BUSINESS::', 'INFO:')
      const parsedBusinessData = parseBusinessData(yelpResponse, 'search')
      context.response.body = parsedBusinessData
    } catch (err) {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'BUSINESS::', 'ERROR:')
    }
  })
  .get('/v1/category', async (context: ctx) => {
    try {
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

      logger.info('%s%s%s Returning response\n', 'APP::', 'CATEGORY::', 'INFO:')
      const parsedCategoryData = parseCategoryData(yelpResponse, 'categories')
      context.response.body = parsedCategoryData
    } catch (err) {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'CATEGORY::', 'ERROR:')
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

app.use(router.routes())
app.use(router.allowedMethods())

async function appTranslator( request: any, response: any ): Promise<APIGatewayProxyResult> {
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
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
   const appResponse = await appTranslator(event, {})
   return appResponse
}
