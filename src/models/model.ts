import { Model } from "mongoose";
import { IOrderModel } from "./order";

export interface IModel {
    order: Model<IOrderModel>;
}