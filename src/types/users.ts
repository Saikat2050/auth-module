import {Range, OrderDir} from "./common"

export type UserTableData = {
	name: string
	email: string
	roleId: string
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
	isEmailVerified: boolean
	isActive: boolean
	isDeleted: boolean
} & Range &
	OrderDir

export type UserDetails = Omit<UserTableData, "password">

export type UpdateUserAPIPayload = {
	_id: string
} & Partial<{
	name: string
	email: {
		email: string
		password: string
	}
	roleId: string
	mobile: {
		mobile: string
		password: string
	}
	dob: string
	address: string
	city: string
	state: string
	country: string
	postalCode: string
}>

export type UpdateUserPayload = {
	_id: string
} & Partial<{
	name: string
	email: string
	roleId: string
	mobile: string
	dob: string
	address: string
	city: string
	state: string
	country: string
	postalCode: string
	isEmailVerified: boolean
	isMobileVerified: boolean
}>

export type DeleteUserPayload = {
	_id: string
	password: string
}

type FilterPayload = {
	_id?: string | string[]
	roleId?: string | string[]
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
