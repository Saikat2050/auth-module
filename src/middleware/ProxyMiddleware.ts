import express, {Request, Response, NextFunction} from "express"
const proxy = require("express-http-proxy")

class ProxyMiddleware {
	constructor() {}
	// proxy middleware
	public async ProxyMiddleware(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const router = express.Router()
		const envVariableName: string | undefined = req.headers.slug
			?.toString()
			.trim()
			.toUpperCase()

		const proxyRoute = process.env[`${envVariableName}`]

		console.log("saikat proxyRoute", proxyRoute)

		router.use(
			proxy(proxyRoute, {
				proxyReqPathResolver: function (req: Request) {
					return req.originalUrl
				}
			})
		)

		console.log("saikat is getting ok")
		next()
		} catch(error) {
			console.log("saikat is getting error", error)
			next()
		}
	}
}

export default new ProxyMiddleware()
