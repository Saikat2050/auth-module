import {Range, OrderDir} from "./common"

export type RoleTableData = {
	slug: string
	title: string
	isDeleted: boolean
} & Range &
	OrderDir

export type RoleDetails = {
	_id: string
} & RoleTableData

export type CreateRolePayload = {
	title: string
}

export type UpdateRolePayload = {
	_id: string
} & Partial<{
	title: string
}>

export type DeleteRolePayload = {
	_id: string
}

type FilterPayload = {
	_id?: string | string[]
	title?: string | string[]
	slug?: string | string[]
}

export type ListRolePayload = {
	filter?: FilterPayload
	range?: Range
	sort?: {
		orderBy?: "title" | "slug"
		orderDir?: OrderDir
	}
	search?: string
}
