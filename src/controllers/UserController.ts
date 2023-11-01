import {Request, Response, NextFunction} from "express"
import userSchema from "../models/users"
import {DbConnection} from "../lib/DbConnection"
import bcrypt from "bcrypt"
import _ from "lodash"

import {SearchPattern} from "../lib/SearchPattern"
import errorData from "../constants/errorData.json"

import {UpdateUserPayload, ListUserPayload} from "../types/users"
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
			if (!listUserData) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			// update
			if (req.body.email) {
				inputData.email = req.body.email.email
				inputData.isVerified = false

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
			await User.findByIdAndUpdate(_id, inputData)

			// await dbConnection.deleteModel("User")

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
						isActive: true
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
						isActive: true
					},
					undefined,
					undefined,
					undefined,
					true
				)
			])

			const [data, [{total}]] = await Promise.all([
				User.aggregate(pipeline, {
					allowDiskUse: true
				}),
				User.aggregate(countPipeline, {
					allowDiskUse: true
				})
			])

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

			if (!userDetails) {
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
			await User.findByIdAndUpdate(_id, {isDeleted: true, isActive: false})

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
