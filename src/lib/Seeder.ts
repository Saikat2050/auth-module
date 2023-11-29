import { allowedOperations } from "../types/common"
const seeders = require("../../seeders/seeder.json")
import userSchema from "../models/users"
import blackListSchema from "../models/blackList"
import roleSchema from "../models/roles"
import Config from "../models/configs"
import { DbConnection } from "./DbConnection"
import _ from "lodash"
import eventEmitter from "./logging"
import mongoose from "mongoose"


let models: any = {}

class Seeder {
    constructor() {}

    async getData (model: any, filter: any) {
        filter = {
            ...filter,
            isDeleted: false
        }
        const dataRequired = await model.findOne(filter).lean()
        return dataRequired._id as string
    }

    async getCount (model: any, filter: any) {
        filter = {
            ...filter,
            isDeleted: false
        }

        return Number(await model.find(filter).count() || 0) > 0 ? false : true
    }

    async insertData (model: any, data: any) {
        data = _.isArray(data) ? data : [data]

        await model.insertMany(data)
    }

    async runSeeder () {
        try {
            eventEmitter.emit(
                "logging",
                `Migration Started!`
            )

            const allDBs = await Config.find({
                isDeleted: false
            })
    
            for (let db of allDBs) {
                const slug = db.slug
                const dbConnection = new DbConnection(slug)
                
                // creating models
                models.Role = await dbConnection.getModel(roleSchema, "Role")
                models.User = await dbConnection.getModel(userSchema, "User")
                models.BlackList = await dbConnection.getModel(blackListSchema, "BlackList")
                
                for (let seeder of seeders) {
                    let isinsertQueryRequired: boolean = true
    
                    let uniqueFilter = {}
                    uniqueFilter[`${seeder.unique}`] = seeder.value[0][`${seeder.unique}`]
                    
                    isinsertQueryRequired = await this.getCount(models[`${seeder.document}`], uniqueFilter)
    
                    if (isinsertQueryRequired) {
                        let linkedData: any = {}
                        if (seeder.link && seeder.link.length) {
                            for (let linkData of seeder.link) {
                                linkedData[`${linkData.key}`] = new mongoose.Types.ObjectId(await this.getData(models[`${linkData.document}`], linkData.filter) as string)
                            }
                        }
    
                        // insert data
                        for (let i = 0; i < seeder.value.length; i++) {
                            seeder.value[i] = {
                                ...seeder.value[i],
                                ...linkedData
                            }
                        }

                        await this.insertData(models[`${seeder.document}`], seeder.value)
                    }
                }
            }

            eventEmitter.emit(
                "logging",
                `Migration Finished`
            )
        } catch(error: any) {
            eventEmitter.emit(
                "logging",
                `Migration Failed - ${error?.toString()}`
            )

            process.exit()
        }
    }
}

export default new Seeder()