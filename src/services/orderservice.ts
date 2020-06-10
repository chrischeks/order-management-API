import { BaseService } from "./baseservice";
import { BasicResponse } from "../dto/output/basicresponse";
import { Status } from "../dto/enums/statusenum";
import { IOrderModel } from "../models/order";
import { NextFunction, Request, Response } from "express";
import { CreateOrderDTO } from "../dto/input/createorderdto";
import { UpdateOrderDTO } from "../dto/input/updateorderdto";
import { validateSync } from "class-validator";
import { handleException } from "../aspects/exception";
import crypto = require('crypto');
import { verify } from "jsonwebtoken";


export class OrderService extends BaseService {

    protected user_id = null;
    protected user_email = null

    @handleException()
    public async verifyPaidOrder(req: Request, res: Response, next: NextFunction){

        var existingOrder = null;
        await req.app.locals.order.findOne( {trxRef : req.params.trxref, status: 'Paid'}).then(result => {
            if(result){
                existingOrder = result;
            }
        });
        
        if(!existingOrder){
            this.sendResponse(new BasicResponse(Status.NOT_FOUND), res);
            return next();
        }

        this.sendResponse(new BasicResponse(Status.SUCCESS_NO_CONTENT), res);
    }

    @handleException()
    public async createOrder(req: Request, res: Response, next: NextFunction){

        const { productName, productType, firstName, lastName, phoneNumber, email, address, numberOfItems,  state, city, userToken } = req.body;
            let dto = new CreateOrderDTO( productName, productType, firstName, lastName, phoneNumber, email, address,  numberOfItems, state, city, userToken);
            let errors = await this.validateNewOrderDetails(dto, req);
            if(this.hasErrors(errors)){
                this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res);
                return next();
            }
            this.saveNewOrderData(req, res, next, dto, this.user_id)
    }

    @handleException()
    public async updateOrder(req: Request, res: Response, next: NextFunction){

        const { productName, productType, firstName, lastName, phoneNumber, email, address, numberOfItems, status, state, city } = req.body;
            let dto = new UpdateOrderDTO( productName, productType, firstName, lastName, phoneNumber, email, address,  numberOfItems, status, state, city);
            
            let errors = await this.validateNewOrderDetails(dto, req);
            if(this.hasErrors(errors)){
                this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION, errors), res);
                return next();
            }
        
            this.updateOrderData(req, res, next, dto)

    }

    @handleException()
    public async listPaidOrders(req: Request, res: Response, next: NextFunction){
       
        await req.app.locals.order.find({status: 'Paid'}).sort({ createdAt: 'descending' }).then(result => {

            if(!result){
                this.sendResponse(new BasicResponse(Status.ERROR), res)
            }else{
                this.sendResponse(new BasicResponse(Status.SUCCESS, result), res)
            }
        })
    }

    @handleException()
    public async listAllOrders(req: Request, res: Response, next: NextFunction){
       
        await req.app.locals.order.find().sort({ createdAt: 'descending' }).then(result => {

            if(!result){
                this.sendResponse(new BasicResponse(Status.ERROR), res)
            }else{
                this.sendResponse(new BasicResponse(Status.SUCCESS, result), res)
            }
        })
    }

    @handleException()
    public async listDueOrders(req: Request, res: Response, next: NextFunction){
       
        await req.app.locals.order.find({ status: 'Due' }).sort({ createdAt: 'descending' }).then(result => {

            if(!result){
                this.sendResponse(new BasicResponse(Status.ERROR), res)
            }else{
                this.sendResponse(new BasicResponse(Status.SUCCESS, result), res)
            }
        })
    }

    @handleException()
    public async listOneOrder(req: Request, res: Response, next: NextFunction){
       
        await req.app.locals.order.findById({ _id: req.params.orderId}).then(result => {

            if(!result){
                this.sendResponse(new BasicResponse(Status.ERROR), res)
            }else{
                this.sendResponse(new BasicResponse(Status.SUCCESS, result), res)
            }
        })
    }

    @handleException()
    public async listCompletedPayouts(req: Request, res: Response, next: NextFunction){
       
        await req.app.locals.order.find({ status: 'Completed' }).populate('referrals').sort({ createdAt: 'descending' }).then(result => {

            if(!result){
                this.sendResponse(new BasicResponse(Status.ERROR), res)
            }else{
                this.sendResponse(new BasicResponse(Status.SUCCESS, result), res)
            }
        })
    }

    @handleException()
    public async listClosedPayouts(req: Request, res: Response, next: NextFunction){
       
        await req.app.locals.order.find({ status: 'Closed' }).populate('referrals').sort({ createdAt: 'descending' }).then(result => {

            if(!result){
                this.sendResponse(new BasicResponse(Status.ERROR), res)
            }else{
                this.sendResponse(new BasicResponse(Status.SUCCESS, result), res)
            }
        })
    }

    @handleException()
    public async listCompletedReferralPayout(req: Request, res: Response, next: NextFunction){
       
        await req.app.locals.order.find({ referralId: req.params.referralId, status: 'Completed'}).populate('referrals').sort({ createdAt: 'descending' }).then(result => {

            if(!result){
                this.sendResponse(new BasicResponse(Status.ERROR), res)
            }else{
                let amountTotal: number = 0;
                result.map(data => amountTotal = amountTotal + parseFloat(data.secret.referralAmount))
                this.sendResponse(new BasicResponse(Status.SUCCESS, result, amountTotal), res)
            }
        })
    }

    @handleException()
    public async listClosedReferralPayouts(req: Request, res: Response, next: NextFunction){
       
        await req.app.locals.order.find({ referralId: req.params.referralId, status: 'Closed'}).populate('referrals').sort({ createdAt: 'descending' }).then(result => {

            if(!result){
                this.sendResponse(new BasicResponse(Status.ERROR), res)
            }else{
                let amountTotal: number = 0;
                result.map(data => amountTotal = amountTotal + parseFloat(data.secret.referralAmount))
                this.sendResponse(new BasicResponse(Status.SUCCESS, result, amountTotal), res)
            }
        })
    }

    hasErrors(errors){
        return !(errors === undefined || errors.length == 0);
    }  

    async saveNewOrderData(req: Request, res: Response, next: NextFunction, dto : CreateOrderDTO, user: any) {
        const { productName, productType, firstName, lastName, phoneNumber, email, address, numberOfItems, state, city } = dto;
        let unitCost;
        if(req.body.productType == 'useries'){
            unitCost = process.env.WATTBANK_U_COST;
        }else if(req.body.productType == 'sseries'){
            unitCost = process.env.WATTBANK_S_COST;
        }

        let referralId = user;
        let referralPercentage : number = parseInt(process.env.REFFERAL_PERCENTAGE)/100 

        const random = Math.floor(Math.random()* 1000);
        const randm = Math.floor(Math.random() * 100);
        const randomStr = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
        const amount : number = unitCost * numberOfItems;
        const referralAmount : number = amount * referralPercentage;

        const trxRef = `wb.${randomStr}-${random}-${randm}${Date.now()}`;

        let secret = {productName, productType, firstName, lastName, phoneNumber, email, address, numberOfItems, unitCost, amount, referralAmount, state, city};
        let order : IOrderModel = req.app.locals.order({secret, referralId, trxRef});
        
        let responseObj = null;
        await order.save().then(result => {
            if (result) {
                responseObj = new BasicResponse(Status.SUCCESS, result);
                return next();
            } else {
                responseObj = new BasicResponse(Status.ERROR);
            }
        }).catch(err => {
            responseObj = new BasicResponse(Status.ERROR, err);
        });
        this.sendResponse(responseObj, res);
    }  

    async updateOrderData(req: Request, res: Response, next: NextFunction, dto: UpdateOrderDTO) {
        
            let existingRecord = null;
            await req.app.locals.order.findById(req.params.orderId).then(result => {
                if(result){
                existingRecord = result;
                }
            }).catch(err => {
                this.sendResponse(new BasicResponse(Status.ERROR, err), res)
            })

            let unitCost;
            if(req.body.productType == 'useries'){
                unitCost = process.env.WATTBANK_U_COST;
            }else if(req.body.productType == 'sseries'){
                unitCost = process.env.WATTBANK_S_COST;
            }

            existingRecord.secret.productType = dto.productType, 
            existingRecord.secret.firstName = dto.firstName, 
            existingRecord.secret.lastName = dto.lastName, 
            existingRecord.secret.phoneNumber = dto.phoneNumber, 
            existingRecord.secret.email = dto.email, 
            existingRecord.secret.address = dto.address, 
            existingRecord.secret.numberOfItems = dto.numberOfItems, 
            existingRecord.secret.unitCost = unitCost, 
            existingRecord.secret.amount = dto.numberOfItems * unitCost
            existingRecord.status = dto.status
            existingRecord.secret.state = dto.state
            existingRecord.secret.city = dto.city
            existingRecord.lastUpdatedAt = new Date()

            const dueTime: any = process.env.DUE_TIME

            if (dto.status === 'Delivered') {
                setTimeout(function() {
                    existingRecord.status = 'Completed',
                    existingRecord.lastUpdatedAt = new Date()
                    existingRecord.expectedPayoutDate = getPayoutDate('wednesday')
                    existingRecord.save()
                }, dueTime)
            }

            function getPayoutDate(day) {
                var d = new Date();
                var date = d.getDay()
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                const newDay = days.indexOf(day)
                if(newDay === -1) return;
                let result;
                if(date === newDay) {
                   d.setDate(d.getDate() + ((7 + newDay) - d.getDay()) % 14);
                   return d;
                } else {
                    d.setDate(d.getDate() + ((7 + newDay) - d.getDay()) % 7);
                    return d;
                }
            }

            await existingRecord.save().then(result => {
                if(result){
                    this.sendResponse(new BasicResponse(Status.SUCCESS, result), res)
                }else{
                    this.sendResponse(new BasicResponse(Status.ERROR), res)
                }
            }).catch (err => {
            this.sendResponse(new BasicResponse(Status.ERROR, err), res)
        });
    }


    @handleException()
    public async receiveEvent(req: Request, res: Response, next: NextFunction){
        console.log('received event from paystack');
        if (!this.isValidPaystackTransaction(req)) {
            console.log('received transaction with invalid signature')
            this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION), res);
            return next();
        }

        if(!this.isSuccessfulChargeEvent(req.body.event)){
            console.log('received an event but it wasnt a successful charge');
            this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION), res);
            return next();
        }
            
        var reference = req.body.data.reference;
        var amount = req.body.data.amount;

        console.log('reference is: '+reference+' and amount is: '+amount);
        
        var existingOrder = null;
        await req.app.locals.order.findOne( {trxRef : reference, status: 'Pending'}).then(result => {
            if(result){
                existingOrder = result;
            }
        });

        if(existingOrder == null){
            console.log('could not fetch order. invalid reference');
            this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION), res);
            return next();
        }

        //now compare the amount above to the amount in the order

        var amountFromOrder = existingOrder.secret.amount * 100 //convert to kobo;

        if(amountFromOrder !== amount){
            console.log('phony transaction. amount doesnt match. amount from paystack: '+amount+' meanwhile order amount is: '+amountFromOrder);
            this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION), res);
            return next();
        }

        existingOrder.paymentVerifiedDate = Date.now();
        existingOrder.secret.paymentData = JSON.stringify(req.body.data);
        existingOrder.status = "Paid";
        // all good, so update order status to 'Paid' and return success
        var updated: boolean = false;
        await existingOrder.save().then(result => {
            if(result){
                updated = true;
            }
        });

        if(!updated){
            console.log('could not update transaction. reference is: '+reference);
            this.sendResponse(new BasicResponse(Status.FAILED_VALIDATION), res);
            return next();
        }

        this.sendResponse(new BasicResponse(Status.SUCCESS), res);
        return next();
    }

    private isSuccessfulChargeEvent(event: string): boolean{
        return 'charge.success' === event;
    }

    private isValidPaystackTransaction(req): boolean{ 
        var secret = process.env.PAYSTACK_SECRET_KEY;

        var hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

        console.log(hash);

        return hash == req.headers['x-paystack-signature'];
    }

    async validateNewOrderDetails(dto: any, req: Request) {
        let errors = validateSync(dto, { validationError: { target: false }} );
        if(this.hasErrors(errors)){
            return errors;
        }

        if(dto.userToken){   
            let validateToken = await this.validateUserToken(dto, req);
            if(!validateToken){
                errors.push(this.getUserTokenError(dto.userToken));
            }        
        }

        return errors;
    }

    async validateUserToken(dto: any, req: Request) {
        let token = dto.userToken;

        try{
            const secret = process.env.REFERRAL_JWT_SECRET;

            let user: any = verify(token, secret);
        
            this.setUserVariables(user);

            return true;
        } catch (err) {
            return false;
        }
    }

    protected setUserVariables(user) {
        this.user_id = user._id;
        this.user_email = user.email;
    }

}