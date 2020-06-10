import { NextFunction, Request, Response, Router } from "express";
import { BaseController } from "./baseController";
import { OrderService } from "../services/orderservice";


export class PaystackController extends BaseController {

  public loadRoutes(prefix: String, router: Router) {

    this.receiveEvent(prefix, router);
    this.verifyPaidOrder(prefix, router);

  }

  public receiveEvent(prefix: String, router: Router): any {
    router.post(prefix + "/new",  (req: Request, res: Response, next: NextFunction) => {

      new OrderService().receiveEvent(req, res, next);

    });
  }

  public verifyPaidOrder(prefix: String, router: Router): any {
    router.patch(prefix + "/verify/:trxref",  (req: Request, res: Response, next: NextFunction) => {

      new OrderService().verifyPaidOrder(req, res, next);

    });
  }

}