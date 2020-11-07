const decoder = new TextDecoder('utf-8')

function decodeBody(body: Uint8Array | Deno.Reader | undefined): string {
  return decoder.decode(body as Uint8Array)
}

function queryObjectToString(queryObject: any): string {
  const queryString = Object.keys(queryObject).map((key) => {
      return key + '=' + queryObject[key]
    }).join('&')
  return queryString
}

async function headersToObject(responseHeaders: Headers): Promise<object> {
  const headersObject: { [key: string]: string } = {}
  responseHeaders.forEach(async (value: string, key: string) => {
    headersObject[key] = value
  })
  return headersObject
}

async function responseBuilder(response: any): Promise<any> {
  const newResponse = {
    statusCode: response?.status,
    headers: await headersToObject(response?.headers),
    body: decodeBody(response?.body)
  }
  return newResponse
}

export { queryObjectToString, decodeBody, responseBuilder }
