var spec = {
  "openapi": "3.0.1",
  "info": {
    "version": "1.0.0",
    "title": "Deno BOB APIs",
    "description": "Takes Yelp API responses and converts them into an easier to digest format."
  },
  "servers": [
    {
      "url": "{protocol}://{domain}{basePath}",
      "description": "The production API server",
      "variables": {
        "protocol": {
          "default": "https",
          "description": "Protocol should be https. http is used when testing locally."
        },
        "domain": {
          "default": "6d00xbzop0.execute-api.us-west-2.amazonaws.com",
          "description": "Domain should be set to the appropriate dev or production value. By default it uses the dev value."
        },
        "basePath": {
          "default": "/dev/v1/",
          "description": "Base path should be set to the appropriate dev or production value. By default it uses the dev value."
        }
      }
    }
  ],
  "paths": {
    "/business": {
      "get": {
        "summary": "Get a list of businesses from a specified location",
        "operationId": "listBusinesses",
        "tags": [
          "Business"
        ],
        "parameters": [
          {
            "$ref": "#/components/parameters/Address"
          }
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BusinessList"
                }
              }
            }
          }
        }
      }
    },
    "/category": {
      "get": {
        "summary": "Get a list of Yelp categories allowed for US businesses",
        "operationId": "listCategories",
        "tags": [
          "Category"
        ],
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CategoryList"
                }
              }
            }
          }
        }
      }
    }
  },
  // "security": [
  //   {
  //     "ApiKeyAuth": []
  //   }
  // ],
  "components": {
    // "securitySchemes": {
    //   "ApiKeyAuth": {
    //     "type": "apiKey",
    //     "in": "header",
    //     "name": "x-api-key"
    //   }
    // },
    "schemas": {
      "Address": {
        "description": "Address",
        "type": "string",
        "pattern": "^(.+,\\s|)(.+,\\s)(.+)(\\s\\d{5,}|)$",
        "example": "EIGHT MILE, AL",
        "examples": {
          "full": {
            "value": "5957 HWY 45, EIGHT MILE, AL 36613",
            "summary": "Full address"
          },
          "partial": {
            "value": "EIGHT MILE, AL 36613",
            "summary": "City, state, and zip"
          },
          "minimal": {
            "value": "EIGHT MILE, AL",
            "summary": "City and state"
          }
        }
      },
      "BusinessHours": {
        "properties": {
          "day": {
            "description": "Day of the week 0-6 (Mon-Sun)",
            "type": "integer",
            "minimum": 0,
            "maximum": 6,
            "example": 1
          },
          "open": {
            "description": "Hours the business is open during",
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": "5:00 pm - 12:00 am"
          }
        }
      },
      "Business": {
        "properties": {
          "id": {
            "description": "ID of a business",
            "type": "string",
            "example": "QULve82crMjaNkgfqfjl2Q"
          },
          "name": {
            "description": "Name of a business",
            "type": "string",
            "example": "Darryl's Corner Bar & Kitchen"
          },
          "alias": {
            "description": "Alias of a business",
            "type": "string",
            "example": "darryls-corner-bar-and-kitchen-boston"
          },
          "url": {
            "description": "Yelp URL for a business",
            "type": "string",
            "example": "https://www.yelp.com/biz/darryls-corner-bar-and-kitchen-boston?adjust_creative=iVlxVNdOxKHBlNbXs2QNTw&utm_campaign=yelp_api_v3&utm_medium=api_v3_graphql&utm_source=iVlxVNdOxKHBlNbXs2QNTw"
          },
          "phone": {
            "description": "Phone number for a business",
            "type": "string",
            "example": "+16175361100"
          },
          "displayPhone": {
            "description": "Readable phone number for a business",
            "type": "string",
            "example": "(617) 354-7644"
          },
          "address": {
            "description": "Address for a business",
            "type": "string",
            "example": "604 Columbus Ave\nBoston, MA 02118"
          },
          "isClosed": {
            "description": "Whether the business is permanantly closed or not",
            "type": "boolean",
            "example": false
          },
          "hours": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/BusinessHours"
            }
          }
        }
      },
      "BusinessList": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Business"
        }
      },
      "Category": {
        "properties": {
          "alias": {
            "description": "Alias of a business",
            "type": "string",
            "example": "bagels"
          },
          "title": {
            "description": "Title of a category",
            "type": "string",
            "example": "Bagels"
          },
          "parentCategory": {
            "description": "The parent category",
            "type": "string",
            "example": "food"
          }
        }
      },
      "CategoryList": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/Category"
        }
      },
      "Error": {
        "description": "<table>\n  <tr>\n    <th>Code</th>\n    <th>Description</th>\n  </tr>\n  <tr>\n    <td>illegal_input</td>\n    <td>The input is invalid.</td>\n  </tr>\n  <tr>\n    <td>not_found</td>\n    <td>The resource is not found.</td>\n  </tr>\n</table>\n",
        "required": [
          "message"
        ],
        "properties": {
          "message": {
            "type": "string",
            "example": "There was an issue while processing the query."
          }
        }
      }
    },
    "parameters": {
      "Address": {
        "name": "location",
        "in": "query",
        "description": "Address to use for search",
        "required": true,
        "schema": {
          "$ref": "#/components/schemas/Address"
        }
      }
    },
    "responses": {
      "BadRequest": {
        "description": "Bad request.",
        "content": {
          "application/json": {
            "schema": {
              "allOf": [
                {
                  "$ref": "#/components/schemas/Error"
                },
                {
                  "type": "object",
                  "properties": {
                    "message": {
                      "type": "string",
                      "example": "Super bad request."
                    }
                  }
                }
              ]
            }
          }
        }
      },
      "NotFound": {
        "description": "The resource is not found.",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      },
      "IllegalInput": {
        "description": "The input is invalid.",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            }
          }
        }
      }
    }
  }
}
