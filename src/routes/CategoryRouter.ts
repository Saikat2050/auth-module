import express, {Router} from "express"

import CategoryController from "../controllers/CategoryController"

//routes
export class CategoryRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", CategoryController.update)
			.post("/list", CategoryController.list)
			.post("/update", CategoryController.update)
			.post("/delete", CategoryController.delete)
	}
}
