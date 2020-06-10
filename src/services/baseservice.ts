import { Validator } from "validator.ts/Validator";
import chalk = require('chalk');
import { BasicResponse } from "../dto/output/basicresponse";
import crypto = require('crypto');
import { NextFunction, Request, Response } from "express";
import * as jwt from 'jsonwebtoken';
import { ITokenData } from '../interfaces/tokenInterface';





export class BaseService {

    protected errors;

    protected hasErrors(input: any): boolean {
        let errors = new Validator().validate(input);
        this.errors = errors;
        return !(errors === undefined || errors.length == 0)
    }

    protected sha256(data) {
        return crypto.createHash("sha256").update(data, "utf8").digest("base64");
    }

    protected sendError(req: Request, res: Response, next: NextFunction, data?: Object) {

        var dat = {
            status: 401,
            data: data
        }
        res.status(401);
        res.send(dat);

    }

    public sendResponse(serviceResponse: BasicResponse, res: Response): any {
        var response = {
            status: serviceResponse.getStatusString(),
            data: serviceResponse.getData(),
            amount: serviceResponse.getAmount()
        }

        res.status(this.getHttpStatus(serviceResponse.getStatusString()));

        console.log('responding with', response);
        res.json(response);
    }

    protected sendException(ex, serviceResponse: BasicResponse, req: Request, res: Response, next: NextFunction): any {
        console.log(chalk.default.blue.bgRed.bold(ex));
        this.sendResponse(serviceResponse, res);
    }

    private getHttpStatus(status: string): number {
        switch (status) {
            case 'SUCCESS':
                return 200;
            case 'CREATED':
                return 201;
            case 'SUCCESS_NO_CONTENT':
                return 204;
            case 'FAILED_VALIDATION':
                return 400;
            case 'NOT_FOUND':
                return 404;
            case 'CONFLICT':
                return 409;
            case 'UNPROCESSABLE_ENTRY':
                return 422;
            case 'UNATHORIZED':
                return 401;
            case 'PRECONDITION_FAILED':
                return 412;
            default:
                return 500;
        }
    }


    protected logInfo(info: string) {
        console.log(chalk.default.blue.bgGreen.bold(info));
    }

    protected logError(error: string) {
        console.log(chalk.default.blue.bgRed.bold(error));
    }

    protected getDuplicateError(name: string): any {
        return { 'property': 'name', 'constraints': { 'unique': 'must be unique' }, value: name };
    }

    protected getDuplicateEmailError(email: string): any {
        return { 'property': 'email', 'constraints': { 'unique': 'email must be unique' }, value: email };
    }

    protected getUserTokenError(userToken: string): any {
        return { 'property': 'userToken', 'constraints': { 'invalid': 'userToken must be a valid token' }, value: userToken };
    }



    protected createToken(user): ITokenData {
        const expiresIn = process.env.REFERRAL_TOKEN_EXPIRY;
        const secret = process.env.REFERRAL_JWT_SECRET;
        const dataStoredInToken = {
            _id: user._id,
            email: user.email
        };
    
        const secure:boolean= true
        const token = jwt.sign(dataStoredInToken, secret, { expiresIn })
        return {
            expiresIn,
            token,
            secure
        };
    }
   

    protected createCookie(tokenData) {
        return `Photizzo=${tokenData.token}; Max-Age=${tokenData.expiresIn}`;
    }

}