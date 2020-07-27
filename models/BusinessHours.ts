class BusinessHours {
    public day: number
    public open: string[]

    constructor(day: number, open: string[]) {
        this.day = day
        this.open = open
    }
}

export { BusinessHours }
