import { NextFunction, Request, Response, Router } from "express";
import { BaseController } from "./baseController";
import { OrderService } from "../services/orderservice";


export class ReferralController extends BaseController {

  public loadRoutes(prefix: String, router: Router) {

    this.listCompletedReferralPayouts(prefix, router);
    this.listClosedReferralPayouts(prefix, router);

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
    if (!this.authorizedReferral(req, res, next)) {
      this.sendError(req, res, next, this.notAuthorized);
    } else {
      next();
    }

  }

  constructor() {
    super();
  }

}