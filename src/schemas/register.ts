
import { Schema, model } from "mongoose";

export let registerSchema: Schema = new Schema({

  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean, default: false
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String
  },
  uuid: {
    type: String,
    required: true
  },
  referralLink: {
    type: String,
    required: true
  },
  referralId: {
    type: String,
    required: true
  },
  accountName: {
    type: String
  },
  accountNumber: {
    type: String
  },
  bankName: {
    type: String
  }
}, { timestamps: true, toJSON: { virtuals: true } });
registerSchema.virtual('referrals', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'referralId',
  justOne: false
});