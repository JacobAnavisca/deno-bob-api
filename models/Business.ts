import { BusinessHours } from './BusinessHours.ts'

class Business {
    public id: string
    public name: string
    public alias: string
    public url: string
    public phone: string
    public displayPhone: string
    public address: string
    public isClosed: boolean
    public hours: BusinessHours[]

    constructor(
      id: string,
      name: string,
      alias: string,
      url: string,
      phone: string,
      displayPhone: string,
      address: string,
      isClosed: boolean,
      hours: BusinessHours[]
    ) {
      this.id = id
      this.name = name
      this.alias = alias
      this.url = url
      this.phone = phone
      this.displayPhone = displayPhone
      this.address = address
      this.isClosed = isClosed
      this.hours = hours
    }
}

export { Business }
