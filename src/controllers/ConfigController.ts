import {Request, Response, NextFunction} from "express"
import Config from "../models/configs"
import _ from "lodash"

import {SearchPattern} from "../lib/SearchPattern"
import errorData from "../constants/errorData.json"

import {
	CreateConfigPayload,
	UpdateConfigPayload,
	ListConfigPayload
} from "../types/configs"
import {ApiResponse} from "../helpers/ApiResponse"
import {createSlug, generatePipeline} from "../helpers/helper"

class ConfigController {
	constructor() {
		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const inputData: CreateConfigPayload = req.body

			const configs = await Config.find({isDeleted: false})
			const slug: string = await createSlug(
				configs,
				"slug",
				inputData.title
			)

			const data = await Config.create({
				...inputData,
				slug
			})

			return response.successResponse({
				message: "Config created successfully",
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {_id, ...inputData}: UpdateConfigPayload = req.body

			const listConfigData = await Config.findById(_id)
			if (
				!listConfigData ||
				Boolean(listConfigData?.isDeleted) === true
			) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Config not found"
				})
			}

			await Config.findByIdAndUpdate(_id, inputData)

			return response.successResponse({
				message: "Config updated successfully"
			})
		} catch (error) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {filter, range, sort, search}: ListConfigPayload = req.body

			const [pipeline, countPipeline] = await Promise.all([
				generatePipeline(
					filter ?? {},
					range,
					sort,
					undefined,
					undefined
				),
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

			let [data, [total]] = await Promise.all([
				Config.aggregate(pipeline, {
					allowDiskUse: true
				}),
				Config.aggregate(countPipeline, {
					allowDiskUse: true
				})
			])

			total = Number(total?.total) || 0

			let searchedData: any[] = []
			if ((search ?? "").toString().trim() !== "") {
				const searchPattern = new SearchPattern(search as string, [
					"title",
					"description"
				])

				const dataChunkArr = _.chunk(data, 200)
				await Promise.all(
					dataChunkArr.map((el) => searchPattern.SearchByPattern(el))
				)

				searchedData = await searchPattern.getSearchedArr()
			}

			return response.successResponseForList({
				message: "Config List fetched successfully",
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
					message: "Config user not found"
				})
			}

			// check if user exist
			const configDetails = await Config.findById(_id)

			if (!configDetails || Boolean(configDetails?.isDeleted) === true) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Black listed user not found"
				})
			}

			// delete
			await Config.findByIdAndUpdate(_id, {isDeleted: true})

			return response.successResponse({
				message: `Config deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new ConfigController()
