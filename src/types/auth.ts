export enum Role {
	SUPER_ADMIN = "super-admin",
	ADMIN = "admin"
}

export type SignInPayload = {
	userName: string
	password: string
}

export type RegisterPayload = {
	name: string
	email: string
	roleId: string
	mobile: string
	password: string
	dob?: string
	address?: string
	city?: string
	state?: string
	country?: string
	postalCode?: string
}

export type SendOtpPayload = {
	userName: string
}

export type ResetPasswordPayload = {
	userName: string
	otp: string
	password: string
}

export type verifyOtpPayload = {
	userName: string
	otp: string
}

export type secretCodeSchema = {
	otp: string
	expireIn: string
	verificationType: string
}
