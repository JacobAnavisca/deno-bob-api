const decoder = new TextDecoder('utf-8')

function decodeBody(body: Uint8Array | Deno.Reader | undefined): string {
  return decoder.decode(body as Uint8Array);
}

async function jsonUint8ArrToString(unit8Object: any): Promise<string> {
  var arr = []
  for (const objectIndex in unit8Object) {
    arr.push(unit8Object[objectIndex as any])
  }
  const uint8 = new Uint8Array(arr)

  let responseBody = await decodeBody(uint8)
  return responseBody
}

function queryObjectToString(queryObject: any): string {
	let queryString = Object.keys(queryObject).map(function(key) {
      return key + '=' + queryObject[key]
    }).join('&')
    return queryString
}

export { jsonUint8ArrToString, queryObjectToString }