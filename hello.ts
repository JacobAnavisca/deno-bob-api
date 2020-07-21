// hello.ts

import { yelpApiRequest } from './data/dataRetriever.ts'
import { jsonUint8ArrToString, queryObjectToString } from './utility/helper.ts'
import { Logger } from './utility/logger.ts'
import { ServerRequest } from "https://deno.land/std@0.57.0/http/server.ts"
import {
  Application,
  Router,
  isHttpError
} from "https://deno.land/x/oak@v5.3.0/mod.ts"
import { Context as ctx } from "https://deno.land/x/oak@v5.3.0/mod.ts"
import { getQuery } from "https://deno.land/x/oak@v5.3.0/helpers.ts"
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from "https://deno.land/x/lambda/mod.ts"

const logger = new Logger({ level: 0, format: "APP::%s" })
const router = new Router()
const app = new Application()

router
  .get("/business", async (context) => {
    // logger.info(Deno.noColor.toString())
    const query = getQuery(context)
    const location = query.location

    logger.info('%s%s: Starting yelp request\n', 'APP::', 'INFO')
    let yelpResponse = await yelpApiRequest(
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

    logger.info('%s%s: Returning yelp response\n', 'APP::', 'INFO')
    context.response.body = yelpResponse
  })
  .get("/category", async (context) => {
    const query = getQuery(context)
    const location = query.location

    logger.info('%s%s: Starting yelp request\n', 'APP::', 'INFO')
    let yelpResponse = await yelpApiRequest(
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

    logger.info('%s%s: Returning yelp response\n', 'APP::', 'INFO')
    context.response.body = yelpResponse
  })

// Error handler
app.use(async (context, next) => {
  try {
    await next()
  } catch (err) {
    if (isHttpError(err)) {
      context.response.status = err.status
      const { message, status, stack } = err
      if (context.request.accepts("json")) {
        context.response.body = { message, status, stack }
        context.response.type = "json"
      } else {
        context.response.body = `${status} ${message}\n\n${stack ?? ""}`
        context.response.type = "text/plain"
      }
    } else {
      logger.error(`%s%s: ${err}\n`, 'APP::', 'ERROR::', 'HANDLER')
      throw err
    }
  }
})

app.use(router.routes())
app.use(router.allowedMethods())

async function appTranslator ( request: any, response: any ): Promise<APIGatewayProxyResult> {
  const context = new ServerRequest()
  context.headers = new Headers()
  for (const header in request.headers) {
    context.headers.set(header, request.headers[header])
  }
  context.proto = 'http'
  context.method = request.httpMethod ?? null
  var query = request.queryStringParameters
    ? '?' + queryObjectToString(request.queryStringParameters)
    : ''
  context.url = `${request.path}${query}` ?? null

  const routerResponse = await app.handle(context)

  let jsonResponse = JSON.parse(JSON.stringify(routerResponse))

  let responseBody = await jsonUint8ArrToString(jsonResponse.body)
  jsonResponse.body = responseBody

  if (responseBody) {
    response = {
      statusCode: jsonResponse.status,
      headers: jsonResponse.headers,
      body: jsonResponse.body
    }
    return response
  }
  return {
      statusCode: 200,
      headers: { "content-type": "text/html;charset=utf8" },
      body: 'Didn\'t work?'
    }
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
   // `Welcome to deno ${Deno.version.deno} 🦕`
   let appResponse = await appTranslator(event, {})
   return appResponse
}