import {Request, Response, NextFunction} from "express"

const successResponse = (data: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode: number = data.statusCode ?? 200

    res.status(statusCode).json(data)
}

const errorResponse = (data: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode: number = data.statusCode ?? 422

    if (!data.errorCode) {
        switch (statusCode) {
            case 400: data.errorCode = 'unexpected_error';
                    break;
            case 401: data.errorCode = 'unauthorized';
                    break;
            case 403: data.errorCode = 'not_enough_permissions';
                    break;
            case 404: data.errorCode = 'not_found';
                    break;
            default: data.errorCode = 'internal_server_error';
                    break;
        }
    }

    res.status(statusCode).json(data)
}