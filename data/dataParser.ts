import { moment } from '../deps.ts'
import { Business } from '../models/Business.ts'
import { BusinessHours } from '../models/BusinessHours.ts'
import { Category } from '../models/Category.ts'
import { BusinessResponse, CategoryResponse } from '../models/YelpResponse.ts'
import { Logger } from '../utility/logger.ts'

const logger = new Logger({ level: 0, format: 'PARSER::%s' })

const SUCCESS_STATUS = 200
const HR_START = 0
const HR_END_MIN_START = 2
const MINUTE_END = 4

function parseResponse(response: any, key: string): BusinessResponse | CategoryResponse {
  if (response.status !== SUCCESS_STATUS) {
    logger.error('%s%s Bad response status\n', 'PARSER::', 'ERROR:')
    logger.error(`%s%s ${response.data}\n`, 'PARSER::', 'ERROR:')
    throw new Error('Bad response status')
  } else {
    return response.data.data[key]
  }
}

function parseTwelveHrFormat(time: string): string {
  const TwelveHrFormat: any = moment(`${time.slice(
    HR_START,
    HR_END_MIN_START)}:${time.slice(
    HR_END_MIN_START, MINUTE_END)}`, 'HH:mm')
  return TwelveHrFormat.format('h:mm a')
}

function parseBusinessData(response: object, key: string): Business[] {
  try {
    const parsedData = parseResponse(response, key) as BusinessResponse

    logger.info(`%s%s%s Updating data\n`, 'PARSER::', 'BUSINESS::', 'INFO:')
    const businesses: Business[] = parsedData.business.map(
      (business: any, mapIndex: number) => {

      const hours: BusinessHours[] = business?.hours?.[0]?.open.reduce(
        (acc: any[], cur: any) => {

          const currentHours = []
          currentHours.push(parseTwelveHrFormat(cur.start) +
            ' - ' +
            parseTwelveHrFormat(cur.end))

          let accIndex = 0
          const dayExists = acc?.[0]
            ? acc.some((element: any, smIndex: number) => {
                accIndex = smIndex
                return element.day === cur.day
              })
            : false

          if (!dayExists) {
            acc.push(new BusinessHours(cur.day, currentHours))
          } else {
            acc[accIndex].open.push(...currentHours)
          }

          return acc
        },
        []
        )

      const updatedBusiness = new Business(
        business.id,
        business.name,
        business.alias,
        business.url,
        business.phone,
        business.display_phone,
        business.location.formatted_address,
        business.is_closed,
        hours
      )

      return updatedBusiness
    })

    logger.info(`%s%s%s Returning updated data\n`, 'PARSER::', 'BUSINESS::', 'INFO:')
    return businesses
  } catch (err) {
    logger.error(`%s%s%s ${err.stack}\n`, 'PARSER::', 'BUSINESS::', 'ERROR:')
    return err
  }
}

function parseCategoryData(response: object, key: string): Category[] {
  try {
    const parsedData = parseResponse(response, key) as CategoryResponse

    logger.info(`%s%s%s Updating data\n`, 'PARSER::', 'CATEGORY::', 'INFO:')
    const categories: Category[] = parsedData.category.map(
      (category: any) => {

        const updatedCategory = new Category(
          category.alias,
          category.title,
          category.parent_categories[0]?.alias
        )

        return updatedCategory
      })

    logger.info(`%s%s%s Returning updated data\n`, 'PARSER::', 'CATEGORY::', 'INFO:')
    return categories
  } catch (err) {
    logger.error(`%s%s%s ${err.stack}\n`, 'PARSER::', 'CATEGORY::', 'ERROR:')
    return err
  }
}

export { parseBusinessData, parseCategoryData }
