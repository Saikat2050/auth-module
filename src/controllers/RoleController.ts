import {Request, Response, NextFunction} from "express"
import Role from "../models/roles"

class RoleController {
	constructor() {
		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const inputData = req.body

			const data = await Role.create(inputData)

			return {
				message: "Role created successfully",
				data
			}
		} catch (error: any) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const {filter, range, sort} = req.body

			let filterObject: any = {}
			let sortObject: any = {}
			let limit: number = 100 // page size
			let skip: number = 0 // page - 1

			// filter
			if (filter?.roleId) {
				filterObject._id = filter.roleId
			}
			if (filter?.search) {
				filterObject.name = new RegExp(`/${filter.search}/`, "g")
			}

			// sort
			if (sort) {
				sortObject[`${sort.orderBy}`] = sort.orderDir ?? 1
			}
			sortObject.createdAt = -1

			// range
			if (range?.pageSize) {
				limit = Number(range.pageSize)
			}
			if (range?.page) {
				const page = Number(range?.page) - 1
				skip = Number(limit * page)
			}

			const data = Role.find(filterObject)
				.sort(sortObject)
				.skip(skip)
				.limit(limit)

			return {
				message: "Role List fetched successfully",
				data
			}
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			let {roleId, ...inputData} = req.body

			const listRoleData = await Role.findById(roleId)
			if (!listRoleData) {
				return {
					message: "Role not found"
				}
			}

			await Role.findByIdAndUpdate(roleId, inputData)

			return {
				message: "Role updated successfully"
			}
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const roleId: string = req.body.roleId

			// check if role exist
			const userDetails = await Role.findById(roleId)

			if (!userDetails) {
				return {
					message: "Role not found"
				}
			}

			// delete
			await Role.findByIdAndUpdate(roleId, {isDeleted: true})

			return {
				message: `Role deleted successfully`
			}
		} catch (error) {
			next(error)
		}
	}
}

export default new RoleController()
