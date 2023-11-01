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

const configSchema = new Schema(
	{
		title: {type: String, required: true},
		description: {type: String, required: false},
		slug: {type: String, required: true},
		config: {
			db_name: {type: String, required: true},
			nodemailer_host: {type: String, required: true},
			nodemailer_service: {type: String, required: true},
			nodemailer_user: {type: String, required: true},
			nodemailer_password: {type: String, required: true}
		},
		isActive: {type: Boolean, default: true},
		isDeleted: {type: Boolean, default: false}
	},
	{timestamps: true}
)
configSchema.plugin(uniqueValidator)

const Config = dbName.model("Config", configSchema)
export default Config
