import express, {Router} from "express"

import UserController from "../controllers/UserController"

//routes
export class UserRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/update", UserController.update)
			.post("/list", UserController.list)
			.post("/delete", UserController.delete)
	}
}
