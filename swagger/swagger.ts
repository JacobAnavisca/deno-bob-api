// hello.ts

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Application,
  Context,
  ctx,
  isHttpError,
  Router,
  ServerRequest,
  ServerResponse
} from '../deps.ts'
import {
  decodeBody,
  queryObjectToString,
  responseBuilder
} from '../utility/helper.ts'
import { Logger } from '../utility/logger.ts'

const logger = new Logger({ level: 0, format: 'APP::%s' })
const router = new Router()
const app = new Application()
const CACHE = {
  warmUpStatus: false
}

router
  .get('/', async (context: ctx) => {
    try {
      logger.info('%s%s%s Getting HTML\n', 'APP::', 'SWGRHTML::', 'INFO:')
      const data = Deno.readFileSync('./swagger/index.html')
      const swaggerHtml = decodeBody(data)
      context.response.body = swaggerHtml
    } catch (err) {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'SWGRHTML::', 'ERROR:')
    }
  })
  .get('/openapi.js', async (context: ctx) => {
    try {
      logger.info('%s%s%s Getting json\n', 'APP::', 'SWGRJS::', 'INFO:')
      const data = Deno.readFileSync('./swagger/openapi.js')
      const swaggerHtml = decodeBody(data)
      context.response.body = swaggerHtml
    } catch (err) {
      logger.error(`%s%s%s ${err.stack}\n`, 'APP::', 'SWGRJS::', 'ERROR:')
    }
  })
  .get('/warmUp', async (context: ctx) => {
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
