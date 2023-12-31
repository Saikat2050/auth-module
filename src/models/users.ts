import mongoose from "mongoose"
import uniqueValidator from "mongoose-unique-validator"
const Schema = mongoose.Schema

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true
		},
		email: {
			type: String,
			required: true
		},
		roleId: [{type: Schema.Types.ObjectId, ref: "Role"}],
		mobile: {type: String, required: true},
		password: {type: String, required: true},
		dob: {type: Date, required: false},
		address: {type: String, required: false},
		city: {type: String, required: false},
		state: {type: String, required: false},
		country: {type: String, required: false},
		postalCode: {type: String, required: false},
		secretCode: {type: String, required: false},
		lastActivatedOn: {type: Date, required: false},
		isEmailVerified: {type: Boolean, default: false},
		isMobileVerified: {type: Boolean, default: false},
		isActive: {type: Boolean, default: true},
		isDeleted: {type: Boolean, default: false}
	},
	{timestamps: true}
)
userSchema.plugin(uniqueValidator)

export default userSchema
