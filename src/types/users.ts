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
	secretCode: string
	lastActivatedOn: string
	isVerified: boolean
	isActive: boolean
	isDeleted: boolean
} & Range &
	OrderDir

export type UserDetails = Omit<UserTableData, "password">

export type UserUpdateAPIPayload = {
	_id: string
} & Partial<{
	name: string
	email: {
		email: string
		password: string
	}
	roleId: number
	mobile: string
	dob: string
	address: string
	city: string
	state: string
	country: string
	postalCode: string
}>

export type UserUpdatePayload = {
	_id: string
} & Partial<{
	name: string
	email: string
	roleId: number
	mobile: string
	dob: string
	address: string
	city: string
	state: string
	country: string
	postalCode: string
	isVerified: boolean
}>

export type DeleteUserPayload = {
	_id: string
	password: string
}

type FilterPayload = {
	_id?: string | string[]
	roleId?: number | number[]
	email?: string | string[]
}

export type ListUserPayload = {
	filter?: FilterPayload
	range?: Range
	sort?: {
		orderBy?: "_id"
		orderDir?: OrderDir
	}
	search?: string
}
