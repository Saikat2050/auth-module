import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

const Schema = mongoose.Schema

const rolesSchema = new Schema(
	{
		title: {type: String, required: true},
		description: {type: String, required: false},
		slug: {type: String, required: false},
		isActive: {type: Boolean, required: true, default: true},
		isDeleted: {type: Boolean, required: false, default: false}
	},
	{
		timestamps: true
	}
)

rolesSchema.plugin(uniqueValidator)

const Role = mongoose.model("Role", rolesSchema)
export default Role
