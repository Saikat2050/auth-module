import mongoose from "mongoose"

export class DbConnection {
	private slug: string

	constructor(slug: string) {
		this.slug = slug
	}

	public async getModel(schema: any, modelName: string) {
		const useDbOptions = {
			//ensures connections to the same databases are cached
			useCache: true,
			//remove event listeners from the main connection
			noListener: true
		}

		const dbName = mongoose.connection.useDb(this.slug, useDbOptions)
		const model = dbName.model(modelName, schema)

		return model
	}

	public async deleteModel(modelName: string) {
		mongoose.deleteModel(modelName)
	}

	public async deleteAllModel() {
		mongoose.connection.deleteModel(/.*/)
	}
}
