import {Request, Response, NextFunction} from "express"
import User from "../models/users"

import {
	UpdateUserPayload,
	ListUserPayload,
	DeleteUserPayload
} from "../types/auth"
import {UserDetails, UserUpdatePayload} from "../types/users"
import helper, {generateOtp, sendSMS, decryptBycrypto} from "../helpers/helper"
import {ApiResponse} from "../helpers/ApiResponse"
import { BadRequestException } from "../lib/exceptions"
// import errorData from "../constants/errorData.json"

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

			const listUserData = await User.findOne({userId: inputData.userId})
			if (!listUserData) {
				throw new Error("User not found")
			}

		// update  
		const data = await User.updateOne({userId: inputData.userId} , {$set: inputData})
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
			const data = await User.findOne({})

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
			const userDetails: UserDetails[] | null = await User.findOne({userId})

			if (!userDetails?.length) {
				throw new BadRequestException("user details not found")
			}

			// delete
			await User.findOneAndUpdate	(
				{ _id: userId },
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
