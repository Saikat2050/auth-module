import similarity from "similarity"
import _ from "lodash"

export class SearchPattern {
	private searchStr: string
	private resultArr: any[]
	private fields: string[]

	constructor(searchStr: string, searchableField: string[]) {
		this.searchStr = searchStr
		this.resultArr = []
		this.fields = searchableField
	}

	public async SearchByPattern(data: any[]) {
		data = data
			.map((el) => {
				let seachableTexts: string = ""
				seachableTexts += this.fields.map(
					(field) => `${el[field] ?? ""} `
				)
				const score = similarity(
					JSON.stringify(seachableTexts),
					this.searchStr,
					{sensitive: false}
				)

				return {
					data: el,
					score
				}
			})
			.filter((el) => Number(el.score) > 0.06)

		this.resultArr = this.resultArr.concat(data)
		return data
	}

	public async getSearchedArr() {
		let data: any[] = _.orderBy(this.resultArr, ["score"], ["desc"])

		data = data.map((el) => {
			return typeof el.data === "string" ? JSON.parse(el.data) : el.data
		})

		return data
	}
}
