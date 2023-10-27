import mongoose from "mongoose"
import eventEmitter from "./logging"

async function createMongoDBURI() {
	if (
		!process.env.MONGODB_USERNAME ||
		!process.env.MONGODB_PASSWORD ||
		!process.env.MONGODB_SERVER ||
		!process.env.MONGODB_MAIN_DB_NAME
	) {
		eventEmitter.emit("logging", "Unable to connect to MongoDB")
		process.exit()
	}

	return `mongodb+srv://${process.env.MONGODB_USERNAME ?? ""}:${
		process.env.MONGODB_PASSWORD ?? ""
	}@${process.env.MONGODB_SERVER ?? ""}/?retryWrites=true&w=majority`
}

async function connectDB() {
	const mongoDB: string = await createMongoDBURI()
	try {
		mongoose.Promise = global.Promise
		await mongoose.connect(mongoDB)
		eventEmitter.emit("logging", "Connected to database")
	} catch (err) {
		// @ts-ignore
		eventEmitter.emit("logging", err.toString())
		process.exit()
	}
}

connectDB()
