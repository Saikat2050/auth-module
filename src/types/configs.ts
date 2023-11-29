import {Range, OrderDir} from "./common"

export type DBConfig = {
	db_name: string
	nodemailer_host: string
	nodemailer_service: string
	nodemailer_user: string
	nodemailer_password: string
}

export type ConfigTableData = {
	title: string
	description: string
	slug: string
	config: DBConfig
	isActive: boolean
	isDeleted: boolean 
} & Range &
	OrderDir

export type ConfigDetails = {
	_id: string
} & ConfigTableData

export type CreateConfigApiPayload = {
	title: string
	description: string
	config: DBConfig
}

export type CreateConfigPayload = {
	title: string
	description: string
	slug: string
	config: DBConfig
}

export type UpdateConfigPayload = {
	_id: string
} & Partial<{
	title: string
	description: string
	config: DBConfig
	isActive: boolean
}>

export type DeleteConfigPayload = {
	_id: string
}

type FilterConfigPayload = {
	_id?: string | string[]
	title?: string | string[]
	slug?: string | string[]
}

export type ListConfigPayload = {
	filter?: FilterConfigPayload
	range?: Range
	sort?: {
		orderBy?: "title"
		orderDir?: OrderDir
	}
	search?: string
}
