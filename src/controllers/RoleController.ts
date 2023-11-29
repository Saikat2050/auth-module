import {Request, Response, NextFunction} from "express"
import roleSchema from "../models/roles"
import {DbConnection} from "../lib/DbConnection"
import mongoose from "mongoose"
import _ from "lodash"

import {SearchPattern} from "../lib/SearchPattern"
import errorData from "../constants/errorData.json"

import {
	RoleTableData,
	RoleDetails,
	CreateRolePayload,
	UpdateRolePayload,
	DeleteRolePayload,
	ListRolePayload
} from "../types/roles"
import {ApiResponse} from "../helpers/ApiResponse"
import {createSlug, generatePipeline} from "../helpers/helper"

class RoleController {
	constructor() {
		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const inputData: CreateRolePayload = req.body
			
			const dbConnection = new DbConnection(req.headers.slug as string)
			// await dbConnection.deleteModel("User")
			
			const Role = await dbConnection.getModel(
				roleSchema,
				"Role"
				)

			const roleData = await Role.find({
				isDeleted: false
			})
			
			const slug: string = await createSlug(roleData, "slug", inputData.title)
			
			const data = await Role.create({
				...inputData,
				slug
			})

			return response.successResponse({
				message: "Role created successfully",
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {_id, ...inputData}: UpdateRolePayload = req.body
			let slug : string | undefined = undefined

			const dbConnection = new DbConnection(req.headers.slug as string)
			const Role = await dbConnection.getModel(
				roleSchema,
				"Role"
			)
			const listRoleData = await Role.findById(_id)
			if (
				!listRoleData ||
				Boolean(listRoleData?.isDeleted) === true
			) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Role not found"
				})
			}

			if (inputData.title) {
				const roleData = await Role.find({
					isDeleted: false
				})

				slug = await createSlug(roleData, "slug", inputData.title)
			}

			await Role.findByIdAndUpdate(_id, {
				...inputData,
				slug
			})

			// await dbConnection.deleteModel("User")

			return response.successResponse({
				message: "Role updated successfully"
			})
		} catch (error) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {filter, range, sort, search}: ListRolePayload = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const Role = await dbConnection.getModel(
				roleSchema,
				"Role"
			)

			const [pipeline, countPipeline] = await Promise.all([
				generatePipeline(
					filter ?? {},
					range,
					sort
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
				Role.aggregate(pipeline, {
					allowDiskUse: true
				}),
				Role.aggregate(countPipeline, {
					allowDiskUse: true
				})
			])

			total = Number(total?.total) || 0

			let searchedData: any[] = []
			if ((search ?? "").toString().trim() !== "") {
				const searchPattern = new SearchPattern(search as string, [
					"slug",
					"title"
				])

				const dataChunkArr = _.chunk(data, 200)
				await Promise.all(
					dataChunkArr.map((el) => searchPattern.SearchByPattern(el))
				)

				searchedData = await searchPattern.getSearchedArr()
			}

			return response.successResponseForList({
				message: "Role List fetched successfully",
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
					message: "Role not found"
				})
			}

			// check if user exist
			const dbConnection = new DbConnection(req.headers.slug as string)
			const Role = await dbConnection.getModel(
				roleSchema,
				"Role"
			)
			const roleDetails = await Role.findById(_id)

			if (!roleDetails || Boolean(roleDetails?.isDeleted) === true) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Role not found"
				})
			}

			// delete
			await Role.findByIdAndUpdate(_id, {isDeleted: true})

			return response.successResponse({
				message: `Role deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new RoleController()
