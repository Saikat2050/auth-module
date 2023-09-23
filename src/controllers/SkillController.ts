import {Request, Response, NextFunction} from "express"
import Skill from "../models/skills"

class SkillController {
	constructor() {
		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const inputData = req.body

			const data = await Skill.create(inputData)

			return {
				message: "Skill created successfully",
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
			if (filter?.skillId) {
				filterObject._id = filter.skillId
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

			const data = Skill.find(filterObject)
				.sort(sortObject)
				.skip(skip)
				.limit(limit)

			return {
				message: "Skill List fetched successfully",
				data
			}
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			let {skillId, ...inputData} = req.body

			const listSkillData = await Skill.findById(skillId)
			if (!listSkillData) {
				return {
					message: "Skill not found"
				}
			}

			await Skill.findByIdAndUpdate(skillId, inputData)

			return {
				message: "Skill updated successfully"
			}
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const skillId: string = req.body.skillId

			// check if role exist
			const userDetails = await Skill.findById(skillId)

			if (!userDetails) {
				return {
					message: "Skill not found"
				}
			}

			// delete
			await Skill.findByIdAndUpdate(skillId, {isDeleted: true})

			return {
				message: `Skill deleted successfully`
			}
		} catch (error) {
			next(error)
		}
	}
}

export default new SkillController()
