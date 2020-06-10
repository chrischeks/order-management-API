import { Document } from "mongoose";
import { IRegister } from "../interfaces/registerInterface";

export interface IRegisterModel extends IRegister, Document {
    //custom methods for your model would be defined here
}