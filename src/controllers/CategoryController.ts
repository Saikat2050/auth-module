import {Request, Response, NextFunction} from "express"
import Category from "../models/categories"

class CategoryController {
	constructor() {
		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const inputData = req.body

			const data = await Category.create(inputData)

			return {
				message: "Category created successfully",
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
			if (filter?.categoryId) {
				filterObject._id = filter.categoryId
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

			const data = Category.find(filterObject)
				.sort(sortObject)
				.skip(skip)
				.limit(limit)

			return {
				message: "Category List fetched successfully",
				data
			}
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			let {categoryId, ...inputData} = req.body

			const listCategoryData = await Category.findById(categoryId)
			if (!listCategoryData) {
				return {
					message: "Category not found"
				}
			}

			await Category.findByIdAndUpdate(categoryId, inputData)

			return {
				message: "Category updated successfully"
			}
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const categoryId: string = req.body.categoryId

			// check if role exist
			const userDetails = await Category.findById(categoryId)

			if (!userDetails) {
				return {
					message: "Category not found"
				}
			}

			// delete
			await Category.findByIdAndUpdate(categoryId, {isDeleted: true})

			return {
				message: `Category deleted successfully`
			}
		} catch (error) {
			next(error)
		}
	}
}

export default new CategoryController()
