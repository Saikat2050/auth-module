import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
const Schema = mongoose.Schema

const useDbOptions = {
	//ensures connections to the same databases are cached
	useCache: true,
	//remove event listeners from the main connection
	noListener: true
}

const dbName = mongoose.connection.useDb(
	process.env.MONGODB_MAIN_DB_NAME as string,
	useDbOptions
)

const blackListSchema = new Schema(
	{
		slug: {type: String, required: true},
		userId: {type: String, required: true},
		status: {type: String, required: true, default: "temporary"},
		remark: {type: String, required: false},
		isDeleted: {type: Boolean, default: false}
	},
	{timestamps: true}
)
blackListSchema.plugin(uniqueValidator)

const BlackList = dbName.model("BlackList", blackListSchema)
export default BlackList
