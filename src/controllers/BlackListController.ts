import {Request, Response, NextFunction} from "express"
import BlackList from "../models/blackList"
import userSchema from "../models/users"
import {DbConnection} from "../lib/DbConnection"
import _ from "lodash"

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

			inputData.slug = (req.headers.slug ?? "").toString().trim()

			const dbConnection = new DbConnection(inputData.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			const listUserData = await User.findById(inputData.userId)
			if (!listUserData) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			// await dbConnection.deleteModel("User")

			const data = await BlackList.create(inputData)

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
			const {_id, ...inputData}: UpdateBlackListPayload = req.body

			inputData.slug = (req.headers.slug ?? "").toString().trim()

			const listBlackListData = await BlackList.findById(_id)
			if (!listBlackListData) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Black listed user not found"
				})
			}

			if (inputData.userId) {
				const dbConnection = new DbConnection(inputData.slug as string)
				const User = await dbConnection.getModel(userSchema, "User")

				const listUserData = await User.findById(inputData.userId)
				if (!listUserData) {
					return response.errorResponse({
						...errorData.NOT_FOUND,
						message: "User not found"
					})
				}

				// await dbConnection.deleteModel("User")s
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
			const {filter, range, sort, search}: ListBlackListPayload = req.body

			const [pipeline, countPipeline] = await Promise.all([
				generatePipeline(filter ?? {}, range, sort),
				generatePipeline(
					filter ?? {},
					range,
					sort,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					true
				)
			])

			const [data, [{total}]] = await Promise.all([
				BlackList.aggregate(pipeline, {
					allowDiskUse: true
				}),
				BlackList.aggregate(countPipeline, {
					allowDiskUse: true
				})
			])

			let searchedData: any[] = []
			if ((search ?? "").toString().trim() !== "") {
				const searchPattern = new SearchPattern(search as string, [
					"slug",
					"userId",
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
			const userDetails = await BlackList.findById(_id)

			if (!userDetails) {
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
