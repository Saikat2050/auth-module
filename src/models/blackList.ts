import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
const Schema = mongoose.Schema

const blackListSchema = new Schema(
	{
		userId: [{ type: Schema.Types.ObjectId, ref: 'User' }],
		status: {type: String, required: true, default: "temporary"},
		remark: {type: String, required: false},
		isDeleted: {type: Boolean, default: false}
	},
	{timestamps: true}
)
blackListSchema.plugin(uniqueValidator)

export default blackListSchema
