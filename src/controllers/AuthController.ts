import {Request, Response, NextFunction} from "express"
import moment from "moment"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import userSchema from "../models/users"
import {DbConnection} from "../lib/DbConnection"

import {
	SignInPayload,
	RegisterPayload,
	SendOtpPayload,
	ResetPasswordPayload,
	verifyOtpPayload,
	secretCodeSchema
} from "../types/auth"
import helper, {decryptBycrypto, encryptionByCrypto} from "../helpers/helper"
import {ApiResponse} from "../helpers/ApiResponse"
import errorData from "../constants/errorData.json"
import eventEmitter from "../lib/logging"

class AuthController {
	constructor() {
		this.register = this.register.bind(this)
		this.sendOtp = this.sendOtp.bind(this)
		this.verifyOtp = this.verifyOtp.bind(this)
		this.resetPassword = this.resetPassword.bind(this)
		this.signIn = this.signIn.bind(this)
		this.refreshToken = this.refreshToken.bind(this)
	}

	public async register(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const inputData: RegisterPayload = req.body

			const [isValidEmail, isValidPhone, isValidPassword]: [
				boolean,
				boolean,
				boolean
			] = await Promise.all([
				// email validation
				helper.regexEmail(inputData.email),

				// phone validation
				inputData.mobile ? helper.regexMobile(inputData.mobile) : false,

				// password validation
				helper.regexPassword(inputData.password)
			])

			if (!isValidEmail) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Email not valid"
				})
			}
			if (inputData.mobile && !isValidPhone) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "Phone number not valid"
				})
			}
			if (!isValidPassword) {
				return response.errorResponse({
					...errorData.BAD_REQUEST,
					message: "Password must be more then 8 char"
				})
			}

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			const [phoneExists, userExists] = await Promise.all([
				inputData.mobile
					? User.findOne({
							mobile: inputData.mobile,
							isDeleted: false
					  })
					: [],
				User.findOne({
					email: inputData.email,
					isDeleted: false
				})
			])
			if (inputData.mobile && phoneExists) {
				return response.errorResponse({
					...errorData.ALREADY_EXISTS,
					message: "Phone number already exists"
				})
			}
			if (userExists) {
				return response.errorResponse({
					...errorData.ALREADY_EXISTS,
					message: "User email already exists"
				})
			}

			// hashing password
			const salt: string = await bcrypt.genSalt(
				parseInt(process.env.SALT_ROUNDS as string)
			)
			inputData.password = await bcrypt.hash(
				inputData.password.trim(),
				salt
			)
			inputData.name = inputData.name
				? inputData.name.trim()
				: inputData.name
			const data = await User.create(inputData)

			// await dbConnection.deleteModel("User")

			return response.successResponse({
				message: "User created successfully",
				data
			})
		} catch (error: any) {
			eventEmitter.emit("logging", error.toString())
			next(error)
		}
	}

	public async sendOtp(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {email}: SendOtpPayload = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			//check if user exist
			const userExists = await User.findOne({
				email,
				isDeleted: false,
				isActive: true
			})
			if (!userExists) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}
			const otpRandom: number = await helper.generateOtp()

			await User.findByIdAndUpdate(userExists._id, {
				secretCode: await encryptionByCrypto(
					JSON.stringify({
						otp: otpRandom,
						expireIn: moment()
							.add(
								process.env.OTP_EXPIRATION_IN_MINUTES,
								"minutes"
							)
							.format()
					})
				)
			})

			// send otp to email
			await helper.sendOtpToEmail(
				email,
				Number(otpRandom),
				userExists.name as string,
				process.env.OTP_FILENAME as string
			)

			// await dbConnection.deleteModel("User")

			return response.successResponse({
				message: `OTP sent successfully`
			})
		} catch (error) {
			next(error)
		}
	}

	public async verifyOtp(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {email, otp}: verifyOtpPayload = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			// check if otp is valid
			const userExists = await User.findOne({
				email,
				isDeleted: false,
				isActive: true
			})
			if (!userExists) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			// varify otp data
			if (userExists.secretCode) {
				const decryptedData = await decryptBycrypto(
					userExists.secretCode
				)
				const otpData: secretCodeSchema =
					typeof decryptedData === "string"
						? JSON.parse(decryptedData)
						: decryptedData

				if (
					Number(otpData.otp) === Number(otp) &&
					moment(otpData.expireIn).diff(moment()) >= 0
				) {
					await User.findByIdAndUpdate(userExists._id, {
						isVerified: true
					})
				} else {
					return response.errorResponse({
						...errorData.BAD_REQUEST,
						message: "Invalid OTP"
					})
				}
			}

			// await dbConnection.deleteModel("User")

			return response.successResponse({
				message: `OTP verified successfully`
			})
		} catch (error) {
			next(error)
		}
	}

	public async resetPassword(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const response = new ApiResponse(res)
			const {email, otp, password}: ResetPasswordPayload = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			// encrypt password
			const isValidPassword: boolean =
				await helper.regexPassword(password)
			if (!isValidPassword) {
				return response.errorResponse({
					...errorData.BAD_REQUEST,
					message: "Password must be more then 8 char"
				})
			}
			const salt: string = await bcrypt.genSalt(
				parseInt(process.env.SALT_ROUNDS as string)
			)
			const encryptPassword: string = await bcrypt.hash(password, salt)

			// check if otp is valid
			const userExists = await User.findOne({
				email,
				isDeleted: false,
				isActive: true
			})
			if (!userExists) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			// varify otp data
			if (userExists.secretCode) {
				const decryptedData = await decryptBycrypto(
					userExists.secretCode
				)
				const otpData: secretCodeSchema =
					typeof decryptedData === "string"
						? JSON.parse(decryptedData)
						: decryptedData

				if (
					Number(otpData.otp) === Number(otp) &&
					moment(otpData.expireIn).diff(moment().format()) >= 0
				) {
					await User.findByIdAndUpdate(userExists._id, {
						password: encryptPassword,
						isVerified: true
					})
				} else {
					return response.errorResponse({
						...errorData.BAD_REQUEST,
						message: "Invalid OTP"
					})
				}
			}

			// await dbConnection.deleteModel("User")

			return response.successResponse({
				message: `Password updated successfully`
			})
		} catch (error) {
			next(error)
		}
	}

	public async signIn(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const inputData: SignInPayload = req.body

			const dbConnection = new DbConnection(req.headers.slug as string)
			const User = await dbConnection.getModel(userSchema, "User")

			//check if user exist
			const userExists = await User.findOne({
				email: inputData.email,
				roleId: inputData.roleId,
				isDeleted: false,
				isActive: true,
				isVerified: true
			})
			if (!userExists) {
				return response.errorResponse({
					...errorData.NOT_FOUND,
					message: "User not found"
				})
			}

			const isValidPassword: boolean = await bcrypt.compare(
				inputData.password,
				userExists.password
			)
			if (!isValidPassword) {
				return response.errorResponse({
					statusCode: 401,
					message: "Email or password mismatch"
				})
			}

			await User.findByIdAndUpdate(userExists._id, {
				lastActivatedOn: moment().format("YYYY-MM-DD")
			})

			// generate token
			const token: string = jwt.sign(
				{
					_id: userExists._id,
					email: userExists.email
				},
				process.env.JWT_SECRET_KEY as string,
				{
					expiresIn: process.env.JWT_TOKEN_EXPIRATION as string
				}
			)

			const data = {
				_id: userExists._id,
				name: userExists.name,
				roleId: userExists.roleId,
				email: userExists.email,
				mobile: userExists.mobile
			}

			// await dbConnection.deleteModel("User")

			return response.successResponse({
				message: "Logged In successfully",
				token,
				data
			})
		} catch (error: any) {
			eventEmitter.emit("logging", error.toString())
			next(error)
		}
	}

	public async refreshToken(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			let accessToken: string = req.headers.authorization as string
			if (!accessToken) {
				return response.errorResponse({
					statusCode: 401,
					message: "Missing authorization header"
				})
			}

			// @ts-ignore
			accessToken = accessToken.split("Bearer").pop().trim()

			const decodedToken = jwt.decode(accessToken)
			if (!decodedToken) {
				return response.errorResponse({
					statusCode: 401,
					message: "Invalid access token"
				})
			}

			// @ts-ignore
			delete decodedToken.iat
			// @ts-ignore
			delete decodedToken.exp
			// @ts-ignore
			delete decodedToken.nbf
			// @ts-ignore
			delete decodedToken.jti

			// generate new token
			const token: string = jwt.sign(
				// @ts-ignore
				decodedToken,
				process.env.JWT_SECRET_KEY as string,
				{
					expiresIn: process.env.JWT_TOKEN_EXPIRATION as string
				}
			)

			return response.successResponse({
				message: `Refresh token generated successfully`,
				data: {token}
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new AuthController()
