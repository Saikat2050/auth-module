import {Request, Response, NextFunction} from "express"
import {createClient} from "redis"
import eventEmitter from "../lib/logging"
import Config from "../models/configs"

class SlugValidation {
	private client
	constructor() {}

	public async connectResdisClient(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		this.client = createClient()

		this.client.on("error", (err) =>
			eventEmitter.emit("logging", err.toString())
		)

		await this.client.connect()
		next()
	}

	public async validateSlug(req: Request, res: Response, next: NextFunction) {
		const slug: string = (req.headers.slug ?? "").toString().trim()

		if (slug === "") {
			next({
				statusCode: 401,
				code: `unauthorize`,
				message: "Missing slug header"
			})
		}

		let serverConfig = await this.client.hGetAll(slug)

		if (!serverConfig) {
			const slugData = await Config.findOne({
				slug: "drop-servicing"
			})

			if (slugData) {
				next({
					statusCode: 401,
					code: `unauthorize`,
					message: "Invalid slug header"
				})
			}

			const configData =
				typeof slugData?.config === "string"
					? JSON.parse(slugData?.config)
					: slugData?.config

			await this.client.hSet(slug, configData)

			serverConfig = await this.client.hGetAll(slug)
		}

		serverConfig = JSON.stringify(serverConfig, null, 2)

		req.headers.serverConfig = serverConfig
		next()
	}

	public async getClient() {
		this.client = createClient()

		this.client.on("error", (err) =>
			eventEmitter.emit("logging", err.toString())
		)

		return await this.client.connect()
	}
}

export default new SlugValidation()
