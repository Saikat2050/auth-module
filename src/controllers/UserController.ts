import {Request, Response, NextFunction} from "express"
import userSchema from "../models/users"
import {DbConnection} from "../lib/DbConnection"
import bcrypt from "bcrypt"
import _ from "lodash"
import SlugValidation from "../middleware/SlugValidation"

import {SearchPattern} from "../lib/SearchPattern"
import errorData from "../constants/errorData.json"

import mongoose from "mongoose"

import {UpdateUserPayload, ListUserPayload} from "../types/users"
import roleSchema from "../models/roles"
import {ApiResponse} from "../helpers/ApiResponse"
import {generatePipeline} from "../helpers/helper"

class UserController {
	constructor() {
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			let {_id, ...inputData}: UpdateUserPayload = req.body

			_id = (req.headers.userId ?? "").toString().trim()

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			const listUserData = await User.findById(_id)
			if (!listUserData || Boolean(listUserData?.isDeleted) === true) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			// update
			if (req.body.email) {
				inputData.email = req.body.email.email
				inputData.isEmailVerified = false

				const isValidPassword: boolean = await bcrypt.compare(
					req.body.email.password,
					listUserData.password
				)
				if (!isValidPassword) {
					return response.errorResponse({
						statusCode: 401,
						message: "Unauthorized"
					})
				}
			}

			if (req.body.mobile) {
				inputData.mobile = req.body.mobile.mobile
				inputData.isMobileVerified = false

				const isValidPassword: boolean = await bcrypt.compare(
					req.body.mobile.password,
					listUserData.password
				)
				if (!isValidPassword) {
					return response.errorResponse({
						statusCode: 401,
						message: "Unauthorized"
					})
				}
			}

			if (inputData.roleId) {
				const Role = await dbConnection.getModel(roleSchema, "Role")
				const listRoleData = await Role.findById(inputData.roleId)
				if (
					!listRoleData ||
					Boolean(listRoleData?.isDeleted) === true
				) {
					return response.errorResponse({
						...errorData.NOT_FOUND,
						message: "Role not found"
					})
				}
			}

			await User.findByIdAndUpdate(_id, inputData)

			// await dbConnection.deleteModel("User")

			// update cache
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

			const slugName: string = `${req.headers.slug}:${req.headers.userId}`

			await client.del(slugName)

			return response.successResponse({
				message: "User updated successfully"
			})
		} catch (error) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {filter, range, sort, search}: ListUserPayload = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")
			let customFilter: any = {}

			if (filter?.roleId) {
				let roleId: any = undefined
				if (typeof filter.roleId === "object") {
					const ids = filter.roleId.map(
						(el) => new mongoose.Types.ObjectId(el)
					)

					roleId = {
						$in: ids
					}
				} else {
					roleId = new mongoose.Types.ObjectId(filter.roleId)
				}

				customFilter = {
					...customFilter,
					roleId
				}

				filter.roleId = undefined
			}

			// const data = await User.find(filterObject)
			// 	.sort(sortObject)
			// 	.skip(skip)
			// 	.limit(limit)
			// 	.lean()

			const [pipeline, countPipeline] = await Promise.all([
				generatePipeline(
					filter ?? {},
					range,
					sort,
					// [
					// 	"name",
					// 	"email",
					// 	"mobile",
					// 	"address",
					// 	"city",
					// 	"state",
					// 	"country",
					// 	"postalCode"
					// ],
					["password", "secretCode"],
					{
						isActive: true,
						...customFilter
					}
				),
				generatePipeline(
					filter ?? {},
					range,
					sort,
					// [
					// 	"name",
					// 	"email",
					// 	"mobile",
					// 	"address",
					// 	"city",
					// 	"state",
					// 	"country",
					// 	"postalCode"
					// ],
					["password", "secretCode"],
					{
						isActive: true,
						...customFilter
					},
					undefined,
					undefined,
					undefined,
					true
				)
			])

			let [data, [total]] = await Promise.all([
				User.aggregate(pipeline, {
					allowDiskUse: true
				}),
				User.aggregate(countPipeline, {
					allowDiskUse: true
				})
			])

			total = Number(total?.total) || 0

			const Role = await dbConnection.getModel(roleSchema, "Role")
			data = await Role.populate(data, {
				path: "roleId",
				select: {
					_id: 1,
					slug: 1,
					title: 1
				}
			})

			let searchedData: any[] = []
			if ((search ?? "").toString().trim() !== "") {
				const searchPattern = new SearchPattern(search as string, [
					"name",
					"email",
					"mobile",
					"address",
					"city",
					"state",
					"country",
					"postalCode"
				])

				const dataChunkArr = _.chunk(data, 200)
				await Promise.all(
					dataChunkArr.map((el) => searchPattern.SearchByPattern(el))
				)

				searchedData = await searchPattern.getSearchedArr()
			}

			// await dbConnection.deleteModel("User")

			return response.successResponseForList({
				message: "User List fetched successfully",
				data: searchedData.length ? searchedData : data,
				total
			})
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const _id: string = (req.headers.userId ?? "").toString().trim()

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			if (_id.toString().trim() === "") {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			// check if user exist
			const userDetails = await User.findById(_id)

			if (!userDetails || Boolean(userDetails?.isDeleted) === true) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			const isValidPassword: boolean = await bcrypt.compare(
				req.body.password,
				userDetails.password
			)
			if (!isValidPassword) {
				return response.errorResponse({
					statusCode: 401,
					message: "Unauthorized"
				})
			}

			// delete
			await User.findByIdAndUpdate(_id, {
				isDeleted: true,
				isActive: false
			})

			// update cache
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

			const slugName: string = `${req.headers.slug}:${req.headers.userId}`

			await client.del(slugName)

			// await dbConnection.deleteModel("User")

			return response.successResponse({
				message: `User deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new UserController()
