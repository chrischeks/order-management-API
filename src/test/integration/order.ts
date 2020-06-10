import { Server } from "../../server";
import * as chai from "chai";

import chaiHttp = require('chai-http');
import 'mocha';
import { expect } from "chai";
import mongoose = require("mongoose");
import { IOrderModel } from "../../models/order";
import { orderSchema } from "../../schemas/order";

process.env.DB_NAME = 'ordermanagement_test';

chai.use(chaiHttp);

let bearerToken;
const pathregister = '/v1/auth/register';
const pathlogin = '/v1/auth/login';
const random = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
const firstname = `test${random}`;
const lastname = `testparent${random}`;
const password = 'ghdhdfhjd';
const email = `${firstname}${lastname}@test.quabbly.com`;
const userApiUrl = process.env.USER_API_URL;
const userRegisterObject = {
  companyName: "Quabbly",
  firstname: firstname,
  lastname: lastname,
  email: email,
  password: password
}

let clearDB = function (done) {
  const MONGODB_CONNECTION: string = process.env.MONGODB_HOST + process.env.DB_NAME;
  console.log(MONGODB_CONNECTION);

  mongoose.set('useCreateIndex', true);
  mongoose.set('useNewUrlParser', true);

  let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);

  let order = connection.model<IOrderModel>("order", orderSchema);

  order.deleteMany(function () {
    connection.close(function () {
      done();
    });
  });
}

after(function (done) {
  clearDB(done);
});

beforeEach(function (done) {
  clearDB(done);
});

var app = Server.bootstrap().app;

describe('Register a new user, and log user in to generate token', () => {
  before((done) => {
    chai.request('https://p-user-api-dev.quabbly.com')
      .post(pathregister)
      .send(userRegisterObject)
      .end((err, res) => {
        if (err) throw err;
        chai.request('https://p-user-api-dev.quabbly.com')
          .post(pathlogin)
          .send({ password: password, username: email })
          .end((err, res) => {
            if (err) throw err;
            bearerToken = res.body.token;
            console.log(bearerToken)
            done();
          });
      });
  });

  const registerData = { baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: `${firstname}@test.quabbly.com`, password: '1234567', phoneNumber: '08765432134' }
  const registerPath = '/v1/auth/register'
  describe('Create Order API Request ', () => {

    let path = '/v1/order'

    it('should place an order successfully', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'

        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
        });
    })


    it('should confirm the owmer of a referral link', async () => {
      const confirmUserLink = '/v1/auth/confirmation'
      const verify_id = "/v1/auth/verify_id/";
      let token;
      let referralId;
      let referralToken;
      let userId;

      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          token = res.body.data.token
          referralId = res.body.data.referralId
          userId = res.body.data.id
        });

      await chai.request(app)
        .post(confirmUserLink)
        .send({ token: token })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data.msg).to.be.eql("Account has been verified. Please log in.")
        })


      await chai.request(app)
        .post(verify_id + referralId)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data.msg).to.exist
          referralToken = res.body.data.msg
        })

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja', userToken: referralToken
        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data.referralId).to.be.eql(userId)
        });
    })


    it('should return an error if product type is invalid', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'yseries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('productType')
          expect(res.body.data[0].constraints.isEnum).to.eql('product type should be valid')
          expect(res.body.data[0].value).to.eql('yseries')
        })
    })


    it('should return an error if product type is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('productType')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('product type is required')
        })
    })

    it('should return an error if lastName is less than 3', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'te', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('lastName')
          expect(res.body.data[0].constraints.minLength).to.eql('lastName must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.be.eql('te')
        })
    })

    it('should return an error if firstName is less than 3', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'te', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('firstName')
          expect(res.body.data[0].constraints.minLength).to.eql('firstName must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.be.eql('te')
        })
    })


    it('should return an error if firstName is more than 100', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong',
          lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('firstName')
          expect(res.body.data[0].constraints.maxLength).to.eql('firstName must be shorter than or equal to 100 characters')
          expect(res.body.data[0].value).to.be.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong')
        })
    })

    it('should return an error if lastName is more than 100', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong',
          phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('lastName')
          expect(res.body.data[0].constraints.maxLength).to.eql('lastName must be shorter than or equal to 100 characters')
          expect(res.body.data[0].value).to.be.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong')
        })
    })

    it('should return an error if phoneNumber is less than 3', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.minLength).to.eql('phoneNumber must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.be.eql('08')
        })
    })

    it('should return an error if phoneNumber is more than 14 digits', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '0823456789098765', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.maxLength).to.eql('phoneNumber must be shorter than or equal to 14 characters')
          expect(res.body.data[0].value).to.be.eql('0823456789098765')
        })
    })

    it('should return an error if phoneNumber is not a string of numbers', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: 'testing', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.isNumberString).to.eql('phoneNumber must be a number string')
          expect(res.body.data[0].value).to.be.eql('testing')
        })
    })

    it('should return an error if email is invalid', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08765432123', email: 'testing',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('email')
          expect(res.body.data[0].constraints.isEmail).to.eql('email must be an email')
          expect(res.body.data[0].value).to.be.eql('testing')
        })
    })

    it('should return an error if email is shorter than 3 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08765432123', email: 'te',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('email')
          expect(res.body.data[0].constraints.minLength).to.eql('email must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.be.eql('te')
        })
    })

    it('should return an error if email is more than 100 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08765432123', email: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('email')
          expect(res.body.data[0].constraints.maxLength).to.eql('email must be shorter than or equal to 100 characters')
          expect(res.body.data[0].value).to.be.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong@photizzo.com')
        })
    })

    it('should return an error if customer address is less than 3', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: 'te', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('address')
          expect(res.body.data[0].constraints.minLength).to.eql('address must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.be.eql('te')
        })
    })

    it('should return an error if address is more than 100', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', address: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong',
          phoneNumber: '08123456789', email: 'testing@photizzo.com',
          firstName: 'testing', lastName: 'testing', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('address')
          expect(res.body.data[0].constraints.maxLength).to.eql('address must be shorter than or equal to 1000 characters')
          expect(res.body.data[0].value).to.be.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongtthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong')
        })
    })

    it('should return an error if number of item is not numeric', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'sseries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 'test', tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('numberOfItems')
          expect(res.body.data[0].constraints.isNumber).to.eql('numberOfItems must be a number')
          expect(res.body.data[0].value).to.eql('test')
        })
    })

    it('should return an error if productName is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productType: 'useries', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, firstName: 'testing_tenant', lastName: 'testing', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('productName')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('product name is required')
          expect(res.body.data[0].value).to.be.eql(undefined)
        })
    })

    it('should return an error if productName is isvalid', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'acara', productType: 'useries', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, firstName: 'testing_tenant', lastName: 'testing', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('productName')
          expect(res.body.data[0].constraints.isEnum).to.eql('product name should be valid')
          expect(res.body.data[0].value).to.be.eql('acara')
        })
    })


    it('should return an error if state is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('state')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('state should not be empty')
        })
    })

    it('should return an error if state is less than 3', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, firstName: 'testing_tenant', lastName: 'testing', state: 'te', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('state')
          expect(res.body.data[0].constraints.minLength).to.eql('state must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.be.eql('te')
        })
    })

    it('should return an error if state is more than 100', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', state: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong',
          phoneNumber: '08123456789', email: 'testing@photizzo.com', lastName: 'testing',
          address: '11b Olutayo Alao street', numberOfItems: 5, firstName: 'testing_tenant', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('state')
          expect(res.body.data[0].constraints.maxLength).to.eql('state must be shorter than or equal to 50 characters')
          expect(res.body.data[0].value).to.be.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong')
        })
    })

    it('should return an error if city is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('city')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('city should not be empty')
        })
    })

    it('should return an error if city is less than 3', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, firstName: 'testing_tenant', lastName: 'testing', city: 'te', state: 'Lagos'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('city')
          expect(res.body.data[0].constraints.minLength).to.eql('city must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.be.eql('te')
        })
    })

    it('should return an error if city is more than 100', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', city: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong',
          phoneNumber: '08123456789', email: 'testing@photizzo.com', lastName: 'testing',
          address: '11b Olutayo Alao street', numberOfItems: 5, firstName: 'testing_tenant', state: 'Lagos'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('city')
          expect(res.body.data[0].constraints.maxLength).to.eql('city must be shorter than or equal to 50 characters')
          expect(res.body.data[0].value).to.be.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong')
        })
    })
  })

  describe('UPDATE order', () => {
    let path = '/v1/order'

    it('should update an order successfully', async () => {

      let orderId;
      await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'

        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          orderId = res.body.data._id
        });

      return await chai.request(app)
        .put(path + '/' + orderId)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', status: 'Started', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.data).exist;
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
        })
    })

    it('should return error if the updated staus is invalid', async () => {

      let orderId;
      await chai.request(app)
        .post(path)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', state: 'Lagos', city: 'Ikeja'

        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          orderId = res.body.data._id
        });

      return await chai.request(app)
        .put(path + '/' + orderId)
        .set('Authorization', `Bearer ${bearerToken}`)
        .send({
          productName: 'WattBank', productType: 'useries', firstName: 'testing', lastName: 'testing', phoneNumber: '08123456789', email: 'testing@photizzo.com',
          address: '11b Olutayo Alao street', numberOfItems: 5, tenantId: 'testing_tenant', status: 'testing', state: 'Lagos', city: 'Ikeja'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('status')
          expect(res.body.data[0].constraints.isEnum).to.eql('status type should be valid')
          expect(res.body.data[0].value).to.be.eql('testing')
        })
    })
  })

})