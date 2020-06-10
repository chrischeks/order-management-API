import { NextFunction, Request, Response, Router } from "express";
import { BaseController } from "./baseController";
import { OrderService } from "../services/orderservice";


export class OrderController extends BaseController {

  public loadRoutes(prefix: String, router: Router) {

    this.createOrder(prefix, router);
    this.updateOrder(prefix, router);
    this.listAllOrders(prefix, router);
    this.listOneOrder(prefix, router);
    this.listDueOrders(prefix, router);
    this.listCompletedPayouts(prefix, router);
    this.listClosedPayouts(prefix, router);
    this.listCompletedReferralPayouts(prefix, router);
    this.listClosedReferralPayouts(prefix, router);

  }

  public createOrder(prefix: String, router: Router): any {
    router.post(prefix + "",  (req: Request, res: Response, next: NextFunction) => {

      new OrderService().createOrder(req, res, next);

    });
  }

  public updateOrder(prefix: String, router: Router): any {
    router.put(prefix + "/:orderId", [this.authorize.bind(this)], (req: Request, res: Response, next: NextFunction) => {
      
      new OrderService().updateOrder(req, res, next);
    });
  }

  public listAllOrders(prefix: String, router: Router): any {
    router.get(prefix + "/all",  [this.authorize.bind(this)], (req: Request, res: Response, next: NextFunction) => {

      new OrderService().listAllOrders(req, res, next);

    });
  }

  public listDueOrders(prefix: String, router: Router): any {
    router.get(prefix + "/due/all",  [this.authorize.bind(this)], (req: Request, res: Response, next: NextFunction) => {

      new OrderService().listDueOrders(req, res, next);

    });
  }

  public listOneOrder(prefix: String, router: Router): any {
    router.get(prefix + "/:orderId",  [this.authorize.bind(this)], (req: Request, res: Response, next: NextFunction) => {

      new OrderService().listOneOrder(req, res, next);

    });
  }

  public listCompletedPayouts(prefix: String, router: Router): any {
    router.get(prefix + "/completed/transactions",  [this.authorize.bind(this)], (req: Request, res: Response, next: NextFunction) => {
      
      new OrderService().listCompletedPayouts(req, res, next);

    });
  }

  public listClosedPayouts(prefix: String, router: Router): any {
    router.get(prefix + "/closed/transactions",  [this.authorize.bind(this)], (req: Request, res: Response, next: NextFunction) => {
      
      new OrderService().listClosedPayouts(req, res, next);

    });
  }

  public listCompletedReferralPayouts(prefix: String, router: Router): any {
    router.get(prefix + "/payouts/completed/:referralId", [this.authorize.bind(this)], (req: Request, res: Response, next: NextFunction) => {

      new OrderService().listCompletedReferralPayout(req, res, next);
    })
  }

  public listClosedReferralPayouts(prefix: String, router: Router): any {
    router.get(prefix + "/payouts/closed/:referralId", [this.authorize.bind(this)], (req: Request, res: Response, next: NextFunction) => {

      new OrderService().listClosedReferralPayouts(req, res, next);

    });
  }

  public authorize(req: Request, res: Response, next: NextFunction) {
    if (!this.authorized(req, res, next)) {
      this.sendError(req, res, next, this.notAuthorized);
    } else {
      next();
    }

  }

  constructor() {
    super();
  }

}