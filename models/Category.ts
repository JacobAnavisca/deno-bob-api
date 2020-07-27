class Category {
    public alias: string
    public title: string
    public parentCategory: string

    constructor(
      alias: string,
      title: string,
      parentCategory: string
    ) {
      this.alias = alias
      this.title = title
      this.parentCategory = parentCategory
    }
}

export { Category }
