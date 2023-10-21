import {Request, Response, NextFunction} from "express"
import User from "../models/users"
import bcrypt from "bcrypt"
import _ from "lodash"

import {SearchPattern} from "../lib/SearchPattern"
import errorData from "../constants/errorData.json"

import {UserUpdatePayload, ListUserPayload} from "../types/users"
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
			let {userId, ...inputData}: UserUpdatePayload = req.body

			const listUserData = await User.findById(userId)
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
			await User.findByIdAndUpdate(userId, inputData)

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
			const userId: string = (req.headers.userId ?? "").toString().trim()

			if (userId === "") {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			// check if user exist
			const userDetails = await User.findById(userId)

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
			await User.findByIdAndUpdate(userId, {isDeleted: true})

			return response.successResponse({
				message: `User deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new UserController()
