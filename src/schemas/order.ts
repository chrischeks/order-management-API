
import { Schema, model } from "mongoose";

export let orderSchema: Schema = new Schema({

  secret: {
    productName: String,
    productType: String,
    firstName: String,
    lastName: String,
    phoneNumber: String,
    email: String,
    address: String,
    numberOfItems: Number,
    unitCost: Number,
    amount: String,
    paymentData: String,
    state: String,
    city: String,
    referralAmount: String,
  },
  referralId: String,
  paymentVerifiedDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'Pending'
  },
  trxRef: String,
  lastUpdatedAt: {
    type: Date
  },
  expectedPayoutDate: {
    type: Date
  }
}, { toJSON: { virtuals: true } });
orderSchema.virtual('referrals', {
  ref: 'Register',
  localField: 'referralId',
  foreignField: '_id',
  justOne: false
});