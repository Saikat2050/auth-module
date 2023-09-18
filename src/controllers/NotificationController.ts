require("dotenv").config()
import {Request, Response, NextFunction} from "express"
import * as nodemailer from 'nodemailer';
// import { NotificationDetails } from "../types/notification";
import { ApiResponse } from "../helpers/ApiResponse";

class NotificationController{
    constructor(){
        this.sendEmail = this.sendEmail.bind(this)
    }
    public async sendEmail(req: Request, res: Response, next: NextFunction) {
        const response = new ApiResponse(res)
        const inputData = req.body
        try {
            const transporter = nodemailer.createTransport({
                service: process.env.NODMAILER_SERVICE as string,
                auth: {
                  user: process.env.NODMAILER_USER as string,
                  pass: process.env.NODMAILER_PASSWORD as string
                },
              })
              const emailArr: string[] = [] 
              
              // Define the email data
              const mailOptions = {
                from: process.env.NODMAILER_USER as string,
                to: emailArr,
                subject: inputData.subject,
                text: inputData.text,
                html: inputData.html
              };
              
              // Send the email
              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.error('Error sending email:', error);
                } else {
                  console.log('Email sent:', info.response);
                }
              })
        } catch (error) {
            next(error)
        }
    }
}

export default new NotificationController()