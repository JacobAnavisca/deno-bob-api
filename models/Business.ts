import { BusinessHours } from './BusinessHours.ts'
import { Category } from './Category.ts'

class Business {
    public id: string
    public name: string
    public alias: string
    public url: string
    public photo: string
    public phone: string
    public displayPhone: string
    public distance: number
    public categories: Category[]
    public address: string
    public coordinates: {
      latitude: number,
      longitude: number
    }
    public isClosed: boolean
    public hours: BusinessHours[]

    constructor(
      id: string,
      name: string,
      alias: string,
      url: string,
      photo: string,
      phone: string,
      displayPhone: string,
      distance: number,
      categories: Category[],
      address: string,
      coordinates: {
        latitude: number,
        longitude: number
      },
      isClosed: boolean,
      hours: BusinessHours[]
    ) {
      this.id = id
      this.name = name
      this.alias = alias
      this.url = url
      this.photo = photo
      this.phone = phone
      this.displayPhone = displayPhone
      this.distance = distance
      this.categories = categories
      this.address = address
      this.coordinates = coordinates
      this.isClosed = isClosed
      this.hours = hours
    }
}

export { Business }
