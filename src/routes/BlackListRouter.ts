import express, {Router} from "express"

import BlackListController from "../controllers/BlackListController"

//routes
export class BlackListRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", BlackListController.create)
			.post("/update", BlackListController.update)
			.post("/list", BlackListController.list)
			.post("/delete", BlackListController.delete)
	}
}
