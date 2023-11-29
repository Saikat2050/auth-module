import {Request, Response, NextFunction} from "express"
import blackListSchema from "../models/blackList"
import userSchema from "../models/users"
import {DbConnection} from "../lib/DbConnection"
import mongoose from "mongoose"
import _ from "lodash"

import SlugValidation from "../middleware/SlugValidation"
import {SearchPattern} from "../lib/SearchPattern"
import errorData from "../constants/errorData.json"

import {
	CreateBlackListPayload,
	UpdateBlackListPayload,
	ListBlackListPayload
} from "../types/black-list"
import {ApiResponse} from "../helpers/ApiResponse"
import {generatePipeline} from "../helpers/helper"

class BlackListController {
	constructor() {
		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const inputData: CreateBlackListPayload = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			const listUserData = await User.findById(inputData.userId)
			if (!listUserData || Boolean(listUserData?.isDeleted) === true) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			// await dbConnection.deleteModel("User")

			const BlackList = await dbConnection.getModel(
				blackListSchema,
				"BlackList"
			)
			const data = await BlackList.create({
				...inputData,
				userId: new mongoose.Types.ObjectId(inputData.userId)
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

			const slugName: string = `${req.headers.slug}:${inputData.userId}`

			await client.del(slugName)

			return response.successResponse({
				message: "User added to black-list successfully",
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			let {_id, ...inputData}: any = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const BlackList = await dbConnection.getModel(
				blackListSchema,
				"BlackList"
			)
			const listBlackListData = await BlackList.findById(_id)
			if (
				!listBlackListData ||
				Boolean(listBlackListData?.isDeleted) === true
			) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Black listed user not found"
				})
			}

			if (inputData.userId) {
				const dbConnection = new DbConnection(
					req.headers.slug as string
				)
				const User = await dbConnection.getModel(userSchema, "User")

				const listUserData = await User.findById(inputData.userId)
				if (
					!listUserData ||
					Boolean(listUserData?.isDeleted) === true
				) {
					return response.errorResponse({
						...errorData.NOT_FOUND,
						message: "User not found"
					})
				}

				inputData = {
					...inputData,
					userId: new mongoose.Types.ObjectId(inputData.userId)
				}
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

				const slugName: string = `${req.headers.slug}:${inputData.userId}`

				await client.del(slugName)
			}

			await BlackList.findByIdAndUpdate(_id, inputData)

			// await dbConnection.deleteModel("User")

			return response.successResponse({
				message: "Black listed user updated successfully"
			})
		} catch (error) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			let {filter, range, sort, search}: ListBlackListPayload = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const BlackList = await dbConnection.getModel(
				blackListSchema,
				"BlackList"
			)
			let customFilter: any = {}

			if (filter?.userId) {
				let userId: any = undefined
				if (typeof filter.userId === "object") {
					const ids = filter.userId.map(
						(el) => new mongoose.Types.ObjectId(el)
					)

					userId = {
						$in: ids
					}
				} else {
					userId = new mongoose.Types.ObjectId(filter.userId)
				}

				customFilter = {
					...customFilter,
					userId
				}

				filter.userId = undefined
			}

			const [pipeline, countPipeline] = await Promise.all([
				generatePipeline(
					filter ?? {},
					range,
					sort,
					undefined,
					customFilter
				),
				generatePipeline(
					filter ?? {},
					range,
					sort,
					undefined,
					customFilter,
					undefined,
					undefined,
					undefined,
					true
				)
			])

			let [data, [total]] = await Promise.all([
				BlackList.aggregate(pipeline, {
					allowDiskUse: true
				}),
				BlackList.aggregate(countPipeline, {
					allowDiskUse: true
				})
			])

			total = Number(total?.total) || 0

			const User = await dbConnection.getModel(userSchema, "User")
			data = await User.populate(data, {
				path: "userId",
				select: {
					_id: 1,
					name: 1,
					email: 1,
					roleId: 1
				}
			})

			let searchedData: any[] = []
			if ((search ?? "").toString().trim() !== "") {
				const searchPattern = new SearchPattern(search as string, [
					"status",
					"remark"
				])

				const dataChunkArr = _.chunk(data, 200)
				await Promise.all(
					dataChunkArr.map((el) => searchPattern.SearchByPattern(el))
				)

				searchedData = await searchPattern.getSearchedArr()
			}

			return response.successResponseForList({
				message: "Black listed user List fetched successfully",
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
			const _id: string = req.body._id

			if (_id.toString().trim() === "") {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Black listed user not found"
				})
			}

			// check if user exist
			const dbConnection = new DbConnection(req.headers.slug as string)
			const BlackList = await dbConnection.getModel(
				blackListSchema,
				"BlackList"
			)
			const userDetails = await BlackList.findById(_id)

			if (!userDetails || Boolean(userDetails?.isDeleted) === true) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Black listed user not found"
				})
			}

			// delete
			await BlackList.findByIdAndUpdate(_id, {isDeleted: true})

			return response.successResponse({
				message: `Black listed user deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new BlackListController()
