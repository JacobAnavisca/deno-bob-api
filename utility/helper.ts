const decoder = new TextDecoder('utf-8')

function decodeBody(body: Uint8Array | Deno.Reader | undefined): string {
  return decoder.decode(body as Uint8Array)
}

// async function jsonUint8ArrToString(unit8Object: any): Promise<string> {
//   const arr = []
//   for (const objectIndex in unit8Object) {
//     arr.push(unit8Object[objectIndex as any])
//   }
//   const uint8 = new Uint8Array(arr)
//
//   const responseBody = decodeBody(uint8)
//   return responseBody
// }

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
