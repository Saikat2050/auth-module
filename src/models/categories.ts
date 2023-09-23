import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"

const Schema = mongoose.Schema

const categoriesSchema = new Schema(
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

categoriesSchema.plugin(uniqueValidator)

const Category = mongoose.model("Category", categoriesSchema)
export default Category
