require("dotenv").config()
require("./lib/db")
import express, {Application, Request, Response, NextFunction} from "express"
import cors from "cors"
import path from "path"
import bodyParser from "body-parser"
import {createStream} from "rotating-file-stream"
import helmet from "helmet"
import compression from "compression"
import moment from "moment"
import fs from "fs"
import morgan from "morgan"
import * as Sentry from "@sentry/node"
import {ProfilingIntegration} from "@sentry/profiling-node"
import eventEmitter from "./lib/logging"
import Seeder from "./lib/Seeder"
// import * as cron from "node-cron"

/* Routes */
import routes from "./routes/MainRouter"

/* Middlewares */
import ApiMiddlewares from "./middleware/ApiMiddlewares"
import ProxyMiddleware from "./middleware/ProxyMiddleware"
import Validator from "./middleware/Validator"
import SlugValidation from "./middleware/SlugValidation"
import {generateSchema} from "./lib/schemaGenerator"

const PORT: number = parseInt(process.env.PORT as string)
const app: Application = express()

// Initiate sentry
Sentry.init({
	dsn: process.env.SENTRY_DNS as string,
	integrations: [
		// enable HTTP calls tracing
		new Sentry.Integrations.Http({tracing: true}),
		// enable Express.js middleware tracing
		new Sentry.Integrations.Express({app}),
		new ProfilingIntegration()
	],
	// Performance Monitoring
	tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
	// Set sampling rate for profiling - this is relative to tracesSampleRate
	profilesSampleRate: 1.0 // Capture 100% of the transactions, reduce in production!
})

app.use(Sentry.Handlers.requestHandler())

// Environments
const SUPPORTED_ENVS = ["development", "staging", "production"]

if (
	!process.env.ENVIRONMENT ||
	!SUPPORTED_ENVS.includes(process.env.ENVIRONMENT)
) {
	const supported = SUPPORTED_ENVS.map((env) => JSON.stringify(env)).join(
		", "
	)

	eventEmitter.emit(
		"logging",
		`ENVIRONMENT = ${process.env.ENVIRONMENT} is not supported. Supported values: ${supported}`
	)

	process.exit()
}

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler())

// common logs
const todayDate = moment().format("YYYY-MM-DD")
const logFileName = `log_${todayDate}.log`

// access logs directory
const accessLogDirectory = path.join(__dirname, "../public/logs/accessLogs")
fs.existsSync(accessLogDirectory) ||
	fs.mkdirSync(accessLogDirectory, {recursive: true})

const accessLogStream = createStream(logFileName, {
	interval: "1d", // rotate daily
	path: accessLogDirectory
})

// access logs
app.use(
	morgan("common", {
		stream: accessLogStream
	})
)

// error logs directory
const errorLogDirectory = path.join(__dirname, "../public/logs/errorLogs")
fs.existsSync(errorLogDirectory) ||
	fs.mkdirSync(errorLogDirectory, {recursive: true})

const errorLogStream = createStream(logFileName, {
	interval: "1d", // rotate daily
	path: errorLogDirectory
})

// error logs
app.use(
	morgan("dev", {
		skip: function (req, res) {
			return res.statusCode < 400
		},
		stream: errorLogStream
	})
)

// Access-Control-Allow-Origin
app.use(ApiMiddlewares.accessControl)

// utils and heplers
app.use(SlugValidation.connectResdisClient)
app.use(SlugValidation.validateSlug)

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, "../", "public")))
app.use(compression())
app.use(ApiMiddlewares.optionsMiddleware)

// use helmet
app.use(helmet.contentSecurityPolicy())
app.use(helmet.crossOriginEmbedderPolicy())
app.use(helmet.crossOriginOpenerPolicy())
app.use(helmet.crossOriginResourcePolicy())
app.use(helmet.dnsPrefetchControl())
app.use(helmet.frameguard())
app.use(helmet.hidePoweredBy())
app.use(helmet.hsts())
app.use(helmet.ieNoOpen())
app.use(helmet.noSniff())
app.use(helmet.originAgentCluster())
app.use(helmet.permittedCrossDomainPolicies())
app.use(helmet.referrerPolicy())
app.use(helmet.xssFilter())

// middlewares
app.use(Validator.schemaValidation)
app.use(Validator.validateToken)
app.use(Validator.roleValidation)
app.use(routes)
app.use(ProxyMiddleware.ProxyMiddleware)
app.use(Sentry.Handlers.errorHandler())
app.use("*", ApiMiddlewares.middleware404)
app.use(ApiMiddlewares.exceptionHandler)

// server
app.listen(PORT, async () => {
	// generate schema
	generateSchema()

	// run seeder
	Seeder.runSeeder()

	eventEmitter.emit("logging", `Auth API is up and running on ${PORT}`)
})
