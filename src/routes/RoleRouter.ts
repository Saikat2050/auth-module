import express, {Router} from "express"

import RoleController from "../controllers/RoleController"

//routes
export class RoleRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", RoleController.create)
			.post("/update", RoleController.update)
			.post("/list", RoleController.list)
			.post("/delete", RoleController.delete)
	}
}
