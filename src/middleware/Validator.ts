import {Request, Response, NextFunction} from "express"
import jwt from "jsonwebtoken"
const Ajv = require("ajv")
import mongoose from "mongoose"

import userSchema from "../models/users"
import roleSchema from "../models/roles"
import {DbConnection} from "../lib/DbConnection"
import SlugValidation from "./SlugValidation"
import blackListSchema from "../models/blackList"
import {Role as RoleEnum} from "../types/auth"

// import schemas from "../../schema/cache.json"
const schemas = require("../../schema/cache.json")
import publicApi from "../schemas/publicRoutes.json"
import reservedApi from "../schemas/reservedRoutes.json"

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
			let client: any = null
			try {
				client = await SlugValidation.getClient()
			} catch (err) {
				next({
					statusCode: 500,
					code: `internal_server_error`,
					message: err?.toString()
				})
			}

			const slugName: string = `${slug}:${userId}`
			let userDetails = await client.hGetAll(slugName)

			// check for user details
			let userDetailsArr = Object.keys(userDetails)
			if (!userDetailsArr?.length) {
				userDetails = null
			}

			if (!userDetails) {
				const dbConnection = new DbConnection(slug)
				const BlackList = await dbConnection.getModel(
					blackListSchema,
					"BlackList"
				)
				const userBlackList = await BlackList.findOne({
					userId: new mongoose.Types.ObjectId(userId),
					isDeleted: false
				})

				if (userBlackList) {
					throw new Error("User is black-listed")
				}

				const User = await dbConnection.getModel(userSchema, "User")

				let userExist = await User.findById(userId)

				if (!userExist || Boolean(userExist?.isDeleted) === true) {
					throw new Error("User does not exist")
				}

				// await dbConnection.deleteModel("User")

				userExist =
					typeof userExist === "string"
						? JSON.parse(userExist)
						: userExist

				await client.hSet(slugName, {
					_id: userExist._id.toString().trim(),
					roleId: JSON.stringify(userExist.roleId).toString().trim(),
					name: userExist.name.toString().trim(),
					email: userExist.email.toString().trim(),
					mobile: userExist.mobile.toString().trim(),
					isEmailVerified: userExist.isEmailVerified
						.toString()
						.trim(),
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

	public async roleValidation(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		let roleId: string | undefined = req.headers.roleId as string
		const reqUrl: string = req.url
		const reqMethod: string = req.method
		let isPermissionRequired: boolean = false

		if (
			(roleId || "").toString().trim() !== "" &&
			typeof JSON.parse(roleId) === "object"
		) {
			roleId = JSON.parse(roleId)[0]
		}

		if ((roleId || "").toString().trim() === "") {
			roleId = undefined
		}

		for (let i = 0; i < reservedApi.length; i++) {
			if (
				reqUrl === reservedApi[i].apiPath &&
				reqMethod === reservedApi[i].method
			) {
				isPermissionRequired = true
			}
		}

		// check for permissions required
		if (!isPermissionRequired) {
			return next()
		}

		// validate roleId
		const dbConnection = new DbConnection(req.headers.slug as string)
		const Role = await dbConnection.getModel(roleSchema, "Role")
		const roleDetails = await Role.findById(roleId)

		if (
			!roleId ||
			!roleDetails ||
			roleDetails.slug.toString().trim() !== RoleEnum.SUPER_ADMIN
		) {
			return next({
				statusCode: 403,
				message: "Forbidden request"
			})
		}

		next()
	}
}

export default new Validator()
