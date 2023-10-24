import mongoose from "mongoose"
import eventEmitter from "./logging"

async function connectDB() {
	const mongoDB: string =
		process.env.MONGODB_URI || "mongodb://localhost:27017/<database>"
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
