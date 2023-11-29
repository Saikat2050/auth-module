import express from "express"

import {AuthRouter, UserRouter, BlackListRouter, RoleRouter} from "."

const router = express.Router()

// auth routes
router.use("/v1/auth", new AuthRouter().router)
router.use("/v1/user", new UserRouter().router)
router.use("/v1/black-list", new BlackListRouter().router)
router.use("/v1/role", new RoleRouter().router)

export default router
