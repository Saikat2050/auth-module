import express, {Router} from "express"

import SkillController from "../controllers/SkillController"

//routes
export class SkillRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", SkillController.update)
			.post("/list", SkillController.list)
			.post("/update", SkillController.update)
			.post("/delete", SkillController.delete)
	}
}
