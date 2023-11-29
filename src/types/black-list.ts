import {Range, OrderDir} from "./common"

export enum BlackListStatus {
	TEMPORARY = "temporary",
	PERMANENT = "permanent"
}

export type BlackListTableData = {
	userId: string
	status: string
	remark: string
	isDeleted: boolean
} & Range &
	OrderDir

export type BlackListDetails = {
	_id: string
} & BlackListTableData

export type CreateBlackListApiPayload = {
	userId: string
	status: BlackListStatus
	remark?: string
}

export type CreateBlackListPayload = {
	userId: string
	status: string
	remark: string
}

export type UpdateBlackListApiPayload = {
	_id: string
} & Partial<{
	userId: string
	status: BlackListStatus
	remark: string
}>

export type UpdateBlackListPayload = {
	_id: string
} & Partial<{
	userId: string
	status: string
	remark: string
}>

export type DeleteBlackListPayload = {
	_id: string
}

type FilterPayload = {
	_id?: string | string[]
	userId?: string | string[]
	status?: string | string[]
}

export type ListBlackListPayload = {
	filter?: FilterPayload
	range?: Range
	sort?: {
		orderBy?: "userId"
		orderDir?: OrderDir
	}
	search?: string
}
