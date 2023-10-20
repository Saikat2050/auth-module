import similarity from "similarity"
import _ from "lodash"

export class SearchPattern {
    private searchStr: string
    private resultArr: any[]

    constructor (searchStr: string) {
        this.searchStr = searchStr
        this.resultArr = []
    }

    public async SearchByPattern(data: any[]) {
        data = data.map((el) => {
            const score = similarity(JSON.stringify(el), this.searchStr)

            return {
                data: el,
                score
            }
        }).filter((el) => el.score > 0)

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

