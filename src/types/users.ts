import {Range, OrderDir} from "./common"

export type UserTableData = {
	name: string
	email: string
	roleId: number
	mobile: string
	password: string
	dob: string
	address: string
	city: string
	state: string
	country: string
	postalCode: string
	secrectCode: string
	lastActivatedOn: string
	isVerified: boolean
	isActive: boolean
	isDeleted: boolean
} & Range & OrderDir

export type UserDetails = Omit<UserTableData, "password">


export type UserUpdatePayload = {
	userId: string
} & Partial<{
	name: string
	email: string
	roleId: number
	mobile: string
	password: string
	dob: string
	address: string
	city: string
	state: string
	country: string
	postalCode: string
	secrectCode: string
	lastActivatedOn: string
	isVerified: boolean
	isActive: boolean
	isDeleted: boolean
}>