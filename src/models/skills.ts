import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

const Schema = mongoose.Schema

const skillsSchema = new Schema(
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

skillsSchema.plugin(uniqueValidator)

const Skill = mongoose.model("Skill", skillsSchema)
export default Skill
