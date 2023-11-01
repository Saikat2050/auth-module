import express from "express"

import {AuthRouter, UserRouter, BlackListRouter} from "."

const router = express.Router()

// auth routes
router.use("/v1/auth", new AuthRouter().router)
router.use("/v1/user", new UserRouter().router)
router.use("/v1/black-list", new BlackListRouter().router)

export default router
