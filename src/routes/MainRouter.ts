import express from "express"

import {
	AuthRouter,
	UserRouter,
	RoleRouter,
	SkillRouter,
	CategoryRouter
} from "."

const router = express.Router()

// auth routes
router.use("/v1/auth", new AuthRouter().router)
router.use("/v1/user", new UserRouter().router)
router.use("/v1/role", new RoleRouter().router)
router.use("/v1/skill", new SkillRouter().router)
router.use("/v1/category", new CategoryRouter().router)

export default router
