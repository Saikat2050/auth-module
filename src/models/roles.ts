import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
const Schema = mongoose.Schema

const roleSchema = new Schema(
	{
		slug: {type: String, unique : true, required: true, dropDups: true},
		title: {type: String, required: true},
		isDeleted: {type: Boolean, default: false}
	},
	{timestamps: true}
)
roleSchema.plugin(uniqueValidator)

export default roleSchema
