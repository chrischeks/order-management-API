import { Document } from "mongoose";
import { IOrder } from "../interfaces/orderInterface";

export interface IOrderModel extends IOrder, Document {
    //custom methods for your model would be defined here
}