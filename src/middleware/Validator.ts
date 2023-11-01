import {Request, Response, NextFunction} from "express"
import jwt from "jsonwebtoken"
const Ajv = require("ajv")
import userSchema from "../models/users"
import {DbConnection} from "../lib/DbConnection"
import SlugValidation from "./SlugValidation"

// import schemas from "../../schema/cache.json"
const schemas = require("../../schema/cache.json")
import publicApi from "../schemas/publicRoutes.json"

const ajv = new Ajv()

class Validator {
	super() {}

	public async schemaValidation(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		let reqUrl: string = req.url
		const typeModule: string[] = reqUrl.split("/")
		typeModule.pop()
		const schemaModulePath = Object.keys(schemas).find(
			(el) => el === typeModule.join("/")
		)

		if (schemaModulePath) {
			// @ts-ignore
			const schemaModule = schemas[schemaModulePath]
			// @ts-ignore
			const schema = schemaModule["schemas"]
			const apiSchema = Object.keys(schema).find((el) => el === reqUrl)
			if (apiSchema) {
				// @ts-ignore
				const valid = ajv.validate(schema[apiSchema], req.body)

				if (!valid) {
					next({
						statusCode: 403,
						code: `invalid_data`,
						message: ajv.errors[0].message
					})
				}
			}
		}
		next()
	}

	public async validateToken(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const reqUrl: string = req.url
			const reqMethod: string = req.method
			for (let i = 0; i < publicApi.length; i++) {
				if (
					reqUrl === publicApi[i].apiPath &&
					reqMethod === publicApi[i].method
				) {
					return next()
				}
			}
			let token: string = req.headers.authorization as string
			if (!token) {
				next({
					statusCode: 401,
					code: `invalid_token`,
					message: "Missing authorization header"
				})
			}

			// @ts-ignore
			token = token.split("Bearer").pop().trim()

			const decoded = await jwt.verify(
				token,
				process.env.JWT_SECRET_KEY as string
			)
			if (!decoded) {
				throw new Error("Invalid token")
			}
			const userId =
				typeof decoded === "string"
					? JSON.parse(decoded)?._id ?? null
					: decoded?._id ?? null
			if (!userId) {
				throw new Error("User does not exist")
			}

			const slug: string = req.headers.slug as string
			const client = await SlugValidation.getClient()

			const slugName: string = `${slug}:${userId}`
			let userDetails = await client.hGetAll(slugName)

			// check for user details
			let userDetailsArr = Object.keys(userDetails)
			if (!userDetailsArr?.length) {
				userDetails = null
			}

			if (!userDetails) {
				const dbConnection = new DbConnection(slug)
				const User = await dbConnection.getModel(userSchema, "User")

				let userExist = await User.findById(userId)

				if (!userExist) {
					throw new Error("User does not exist")
				}

				// await dbConnection.deleteModel("User")

				userExist =
					typeof userExist === "string"
						? JSON.parse(userExist)
						: userExist

				await client.hSet(slugName, {
					_id: userExist._id.toString().trim(),
					roleId: userExist.roleId.toString().trim(),
					name: userExist.name.toString().trim(),
					email: userExist.email.toString().trim(),
					mobile: userExist.mobile.toString().trim(),
					isVerified: userExist.isVerified.toString().trim(),
					isActive: userExist.isActive.toString().trim()
				})

				userDetails = await client.hGetAll(slugName)
			}

			userDetails = JSON.stringify(userDetails, null, 2)
			userDetails = JSON.parse(userDetails)

			// userID
			req.headers.userId = userDetails._id.toString()

			// roleID
			req.headers.roleId = userDetails.roleId.toString()

			next()
		} catch (err: any) {
			next({
				statusCode: 401,
				code: `invalid_token`,
				message: err.message
			})
		}
	}
}

export default new Validator()
