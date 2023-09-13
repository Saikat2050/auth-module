import {Request, Response, NextFunction} from "express"
import User from "../models/users"

import errorData from "../constants/errorData.json"

import {UserDetails, UserShortDetails, UserUpdatePayload} from "../types/users"
import {ApiResponse} from "../helpers/ApiResponse"

class AuthController {
	constructor() {
		
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const inputData: UserUpdatePayload = req.body

			const listUserData = await User.findById({userId: inputData.userId})
			if (!listUserData) {
				throw new Error("User not found")
			}
		
		// update  
		const data = await User.findByIdAndUpdate({userId: inputData.userId} , {$set: inputData, $isVerified: false})
		return response.successResponse({
			message : "User updated successfully",
			data
		})
		} catch (error) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const data: UserShortDetails | null = await User.find().sort().limit(20)

			return response.successResponse({
				message: "",
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const userId: string = req.body.userId

			// check if user exist
			const userDetails: UserDetails[] | null = await User.findById({userId})

			if (!userDetails?.length) {
				return response.errorResponse({
					...errorData.ALREADY_EXISTS,
					message: "user details not found"
				})
			}

			// delete
			await User.findByIdAndUpdate(
				{ userId: userId },
				{ deleted: true },
				{ new: true }
			)
	
			return response.successResponse({
				message: `user deleted`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new AuthController()
