import {Request, Response, NextFunction} from "express"
import {createClient} from "redis"
import eventEmitter from "../lib/logging"
import Config from "../models/configs"
// import {readFileSync} from "fs"

let redisClientConfig: any = {
	username: process.env.REDIS_SERVER_USERNAME as string,
	password: process.env.REDIS_SERVER_PASSWORD as string,
	socket: {
		host: process.env.REDIS_SERVER_HOST as string,
		port: Number(process.env.REDIS_SERVER_PORT),
		tls: false
		// key: readFileSync('./redis_user_private.key'),
		// cert: readFileSync('./redis_user.crt'),
		// ca: [readFileSync('./redis_ca.pem')]
	}
}

class SlugValidation {
	private client
	constructor() {}

	public async connectResdisClient(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const redisClientConfigArr = Object.keys(redisClientConfig)
			if (!redisClientConfigArr?.length) {
				redisClientConfig = undefined
			}

			this.client = createClient(redisClientConfig)

			this.client.on("error", (err) => {
				eventEmitter.emit("logging", err.toString())
				throw err
				// process.exit()
			})

			await this.client.connect()
			next()
		} catch (error) {
			eventEmitter.emit("logging", error?.toString())
			next({
				statusCode: 500,
				code: `internal_server_error`,
				message: error?.toString()
			})
			// process.exit()
		}
	}

	public async validateSlug(req: Request, res: Response, next: NextFunction) {
		try {
			const slug: string = (req.headers.slug ?? "").toString().trim()

			if (slug === "") {
				next({
					statusCode: 401,
					code: `unauthorize`,
					message: "Missing slug header"
				})
			}

			let serverConfig = await this.client.hGetAll(slug)

			// check for server configuration
			let serverConfigArr = Object.keys(serverConfig)
			if (!serverConfigArr?.length) {
				serverConfig = null
			}
			if (!serverConfig) {
				const slugData = await Config.findOne({
					slug,
					isDeleted: false
				})

				if (!slugData) {
					next({
						statusCode: 401,
						code: `unauthorize`,
						message: "Invalid slug header"
					})
				} else {
					const configData =
						typeof slugData?.config === "string"
							? JSON.parse(slugData?.config)
							: slugData?.config

					await this.client.hSet(slug, configData)

					serverConfig = await this.client.hGetAll(slug)
				}
			}

			serverConfig = JSON.stringify(serverConfig, null, 2)

			req.headers.serverConfig = serverConfig
			next()
		} catch (error) {
			eventEmitter.emit("logging", error?.toString())
			next({
				statusCode: 500,
				code: `internal_server_error`,
				message: error?.toString()
			})
			// process.exit()
		}
	}

	public async getClient() {
		try {
			const redisClientConfigArr = Object.keys(redisClientConfig)
			if (!redisClientConfigArr?.length) {
				redisClientConfig = undefined
			}

			this.client = createClient(redisClientConfig)

			this.client.on("error", (err) => {
				eventEmitter.emit("logging", err.toString())
				throw err
				// process.exit()
			})

			return await this.client.connect()
		} catch (error) {
			eventEmitter.emit("logging", error?.toString())
			throw error
			// process.exit()
		}
	}
}

export default new SlugValidation()
