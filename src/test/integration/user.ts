import { Server } from "../../server";
import * as chai from "chai";

import chaiHttp = require('chai-http');
import 'mocha';
import { expect } from "chai";
import mongoose = require("mongoose");
import { IRegisterModel } from "../../models/register";
import { registerSchema } from "../../schemas/register";
import { Cookie } from "cookiejar";
import { MinLength, IsNotEmpty } from 'class-validator';

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

  mongoose.set('useCreateIndex', true);
  mongoose.set('useNewUrlParser', true);

  let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);

  let register = connection.model<IRegisterModel>("Register", registerSchema);

  register.deleteMany(function () {
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




  const registerData = { baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134' }
  const registerPath = '/v1/auth/register'

  let moreThan30CharString = "This string is a very long string and it contains much more than thirty characters"
  describe('Confirm User API Request ', () => {

    const confirmationPath = '/v1/auth/confirmation'
    let invalidToken;

    it('should display an error for users with invalid token', async () => {

      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')

        });

      invalidToken = "bhjjbjnjnjnkjjk"
      return await chai.request(app)
        .post(confirmationPath)
        .send({ token: invalidToken })
        .then(res => {
          expect(res).to.have.status(412)
          expect(res.body.status).to.equal('PRECONDITION_FAILED')
          expect(res.body.data.msg).to.be.eql("Account activation failed. Your verification link may have expired.")
        })
    })
  })


  describe('Resend Link API Request ', () => {

    const resendLink = '/v1/auth/resend'
    let UnregisteredEmail;

    it('should display an error for users with invalid token', async () => {

      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')

        });

      UnregisteredEmail = "UnregisteredEmail@quabbly.com"
      return await chai.request(app)
        .post(resendLink)
        .send({ email: UnregisteredEmail, baseUrl: "https://www.photizzo.com" })
        .then(res => {
          expect(res).to.have.status(404)
          expect(res.body.status).to.equal('NOT_FOUND')
          expect(res.body.data.msg).to.be.eql("We were unable to find a user with that email.")
        })
    })
  })


  describe('Confirm User API Request ', () => {

    const confirmUserLink = '/v1/auth/confirmation'
    let token;

    it('should throw an error if token has expired or no token was entered', async () => {

      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          token = res.body.data.token
        });

      return await chai.request(app)
        .post(confirmUserLink)
        .send({ token: "" })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('token')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('token is required')
          expect(res.body.data[0].value).to.eql('')
        })
    })


    it('should throw an error if an invalid token was entered', async () => {

      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          token = res.body.data.token
        });

      return await chai.request(app)
        .post(confirmUserLink)
        .send({ token: "invalidToken" })
        .then(res => {
          expect(res).to.have.status(412)
          expect(res.body.status).to.equal('PRECONDITION_FAILED')
          expect(res.body.data.msg).to.be.eql('Account activation failed. Your verification link may have expired.')
        })
    })


    it('should confirm a registered user', async () => {

      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          token = res.body.data.token
        });

      return await chai.request(app)
        .post(confirmUserLink)
        .send({ token: token })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data.msg).to.be.eql("Account has been verified. Please log in.")
        })
    })
  })



  describe('Register User API Request ', () => {
    let path = '/v1/auth/register'
    it('should crete a user successfully', async () => {

      return await chai.request(app)
        .post(path)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data.msg).to.be.eql("A verification email has been sent to teastname@test.quabbly.com.")
        });
    })

    it('should return an error message when a user enters an invalid baseUrl', async () => {
      return await chai.request(app)
        .post(path)
        .send({ baseUrl: "http://photizzo", firstName: 'testname', lastName: 'testname', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134' })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data[0].property).to.be.eql("baseUrl");
          expect(res.body.data[0].constraints.isUrl).to.be.eql(
            "baseUrl must be an URL address"
          );
          expect(res.body.data[0].value).to.be.eql("http://photizzo");
        })

    });



    it('should return an error message if a user failed to enter a baseUrl', async () => {
      return await chai.request(app)
        .post(path)
        .send({ baseUrl: "", firstName: 'testname', lastName: 'testname', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134' })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.status).to.be.eql('FAILED_VALIDATION');
          expect(res.body.data[0].property).to.be.eql("baseUrl");
          expect(res.body.data[0].constraints.isUrl).to.be.eql(
            "baseUrl must be an URL address"
          );
          expect(res.body.data[0].constraints.isNotEmpty).to.be.eql(
            "baseUrl is required"
          );
          expect(res.body.data[0].value).to.be.eql("");
        })

    });


    it('should return an error if first name is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: '', lastName: 'testname', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('firstName')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('firstName is required')
          expect(res.body.data[0].constraints.minLength).to.eql('firstName must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.eql('')
        })
    })

    it('should return an error if first name length is less than 3 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'qu', lastName: 'testname', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('firstName')
          expect(res.body.data[0].constraints.minLength).to.eql('firstName must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.eql('qu')
        })
    })

    it('should return an error if first name length is more than 100 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong',
          lastName: 'testname', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('firstName')
          expect(res.body.data[0].constraints.maxLength).to.eql('firstName must be shorter than or equal to 30 characters')
          expect(res.body.data[0].value).to.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong')
        })
    })

    it('should return an error if last name is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: '', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('lastName')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('lastName is required')
          expect(res.body.data[0].constraints.minLength).to.eql('lastName must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.eql('')
        })
    })

    it('should return an error if last name length is less than 3 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'qu', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('lastName')
          expect(res.body.data[0].constraints.minLength).to.eql('lastName must be longer than or equal to 3 characters')
          expect(res.body.data[0].value).to.eql('qu')
        })
    })

    it('should return an error if last name length is more than 100 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", lastName: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong',
          firstName: 'testname', email: 'teastname@test.quabbly.com', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('lastName')
          expect(res.body.data[0].constraints.maxLength).to.eql('lastName must be shorter than or equal to 30 characters')
          expect(res.body.data[0].value).to.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong')
        })
    })

    it('should return an error if email is invalid', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('email')
          expect(res.body.data[0].constraints.isEmail).to.eql('email must be an email')
          expect(res.body.data[0].value).to.eql('testname')
        })
    })

    it('should return an error if email is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: '', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('email')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('email is required')
          expect(res.body.data[0].value).to.eql('')
        })
    })

    it('should return an error if email length is less than 3 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'qu', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('email')
          expect(res.body.data[0].constraints.isEmail).to.equal('email must be an email')
          expect(res.body.data[0].value).to.eql('qu')
        })
    })

    it('should return an error if email length is more than 100 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", email: 'tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong',
          firstName: 'testname', lastName: 'teastname', password: '1234567', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('email')
          expect(res.body.data[0].constraints.isEmail).to.equal('email must be an email')
          expect(res.body.data[0].value).to.eql('tthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolongthisisatestnamethatisquitesimplytoolong')
        })
    })

    it('should return an error if password is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com', password: '', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('password')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('password is required')
          expect(res.body.data[0].constraints.minLength).to.eql('password must be longer than or equal to 5 characters')
          expect(res.body.data[0].value).to.eql('')
        })
    })

    it('should return an error if password length is less than 3 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com', password: 'qu', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('password')
          expect(res.body.data[0].constraints.minLength).to.eql('password must be longer than or equal to 5 characters')
          expect(res.body.data[0].value).to.eql('qu')
        })
    })

    it('should return an error if phone number is invalid', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com', password: '1234567', phoneNumber: 'testname'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.isNumberString).to.eql('phoneNumber must be a number string')
          expect(res.body.data[0].value).to.eql('testname')
        })
    })



    it('should return an error if phone number length is more than 11 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'teastname', email: 'testname@test.quabbly.com', password: '1234567', phoneNumber: '123456789012'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.length).to.eql('phoneNumber must be shorter than or equal to 11 characters')
          expect(res.body.data[0].value).to.eql('123456789012')
        })
    })


    it('should return an error if phone number length is less than 11 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'teastname', email: 'testname@test.quabbly.com', password: '1234567', phoneNumber: '123456789'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.length).to.eql('phoneNumber must be longer than or equal to 11 characters')
          expect(res.body.data[0].value).to.eql('123456789')
        })
    })

    it('should return an error if password is undefined', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com', password: '', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('password')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('password is required')
          expect(res.body.data[0].constraints.minLength).to.eql('password must be longer than or equal to 5 characters')
          expect(res.body.data[0].value).to.eql('')
        })
    })

    it('should return an error if password length is less than 3 characters', async () => {

      return await chai.request(app)
        .post(path)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com', password: 'qu', phoneNumber: '08765432134'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('password')
          expect(res.body.data[0].constraints.minLength).to.eql('password must be longer than or equal to 5 characters')
          expect(res.body.data[0].value).to.eql('qu')
        })
    })

  });



  describe('Login User API Request ', () => {

    const loginPath = '/v1/auth/login'
    const registerPath = '/v1/auth/register'

    it('should display unverified for a user with the right credentials but yet to be verified', async () => {

      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
        });


      return await chai.request(app)
        .post(loginPath)
        .send({
          username: 'teastname@test.quabbly.com', password: '1234567'
        })
        .then(res => {
          expect(res).to.have.status(412)
          expect(res.body.status).to.be.eql('PRECONDITION_FAILED')
          expect(res.body.data.msg).to.eql("Your account has not been verified.")
        })
    })



    it('should give unauthorized error for a user with wrong credentials', async () => {

      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
        });


      await chai.request(app)
        .post(loginPath)
        .send({
          username: 'teastname@gee.com', password: '12345671'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql("FAILED_VALIDATION")
          expect(res.body.data.msg).to.eql("Username or password is incorrect")
        })

      return await chai.request(app)
        .post(loginPath)
        .send({
          username: 'teastname1@gee.com', password: '1234567'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql("FAILED_VALIDATION")
          expect(res.body.data.msg).to.eql("Username or password is incorrect")
        })
    })

    it('should return an error if username was not entered', async () => {

      return await chai.request(app)
        .post(loginPath)
        .send({ password: '1234567' })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('username')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('userName is required')
          expect(res.body.data[0].constraints.isEmail).to.eql("username must be an email")
        })
    })


    it('should return an error message if password was not entered', async () => {

      return await chai.request(app)
        .post(loginPath)
        .send({ username: 'bhbhbh@test.quabbly.com' })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data[0].property).to.eql('password')
          expect(res.body.data[0].constraints.isNotEmpty).to.eql('password is required')
          expect(res.body.data[0].children).to.eql([])
        })
    })

    it('should return an error message if username is not an email', async () => {

      return await chai.request(app)
        .post(loginPath)
        .send({ username: 'testname', password: '1234567' })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.equal('username')
          expect(res.body.data[0].constraints.isEmail).to.eql('username must be an email')
          expect(res.body.data[0].value).to.eql('testname')
        })
    })
  })






  describe('GET Registered Users', () => {
    let path = '/v1/auth/users'

    it('should get all registered users user successfully', async () => {

      await chai.request(app)
        .post('/v1/auth/register')
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
        });

      return await chai.request(app)
        .get('/v1/auth/users')
        .set('Authorization', `Bearer ${bearerToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body.data).exist;
          expect(res.body.status).to.be.eql('SUCCESS');
          expect(res.body.data).exist;
        })
    })
  })



  describe('Send password reset link API', () => {
    const resetLink = '/v1/auth/send_link'

    it('should send an error if an is not in the database', async () => {

      await chai.request(app)
        .post(resetLink)
        .send({ email: "test@quabbly.com", baseUrl: "https://www.photizzo.com" })
        .then(res => {
          expect(res).to.have.status(404)
          expect(res.body.status).to.equal('NOT_FOUND')
          expect(res.body.data.msg).to.be.eql('We were unable to find a user with that email.')
        });
    })

    it('should send an error if an invalid email is supplied', async () => {

      await chai.request(app)
        .post(resetLink)
        .send({ email: "testing", baseUrl: "https://www.photizzo.com" })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('email')
          expect(res.body.data[0].constraints.isEmail).to.be.eql('email must be an email')
          expect(res.body.data[0].value).to.be.eql('testing')
        });
    })

    it('should send an error if an no email is supplied', async () => {

      await chai.request(app)
        .post(resetLink)
        .send({ email: "", baseUrl: "https://www.photizzo.com" })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('email')
          expect(res.body.data[0].constraints.isEmail).to.be.eql('email must be an email')
          expect(res.body.data[0].constraints.isNotEmpty).to.be.equal('email is required')
          expect(res.body.data[0].value).to.be.eql('')
        });
    })

    it('should send an error if no baseurl supplied', async () => {

      await chai.request(app)
        .post(resetLink)
        .send({ email: "testing@quabbly.com", baseUrl: "" })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('baseUrl')
          expect(res.body.data[0].constraints.isUrl).to.be.eql('baseUrl must be an URL address')
          expect(res.body.data[0].constraints.isNotEmpty).to.be.equal('baseUrl is required')
          expect(res.body.data[0].value).to.be.eql('')
        });
    })

    it('should send an error if an invalid baseurl is supplied', async () => {

      await chai.request(app)
        .post(resetLink)
        .send({ email: "testing@quabbly.com", baseUrl: "testing" })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('baseUrl')
          expect(res.body.data[0].constraints.isUrl).to.be.eql('baseUrl must be an URL address')
          expect(res.body.data[0].value).to.be.eql('testing')
        });
    })
  })


  describe('Reset password API', () => {
    const resetPassword = '/v1/auth/reset_password'

    it('should send an error if id is not in the database', async () => {

      await chai.request(app)
        .post(resetPassword)
        .send({ id: '5c3bcfc1eb99dd0010d335fe', password: '123456' })
        .then(res => {
          expect(res).to.have.status(404)
          expect(res.body.status).to.equal('NOT_FOUND')
          expect(res.body.data.msg).to.be.eql('We were unable to find a user for this account.')
        });
    })

    it('should send an error if no id is supplied', async () => {

      await chai.request(app)
        .post(resetPassword)
        .send({ id: '', password: '123456' })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('id')
          expect(res.body.data[0].constraints.isNotEmpty).to.be.eql('id is required')
          expect(res.body.data[0].value).to.be.eql('')
        });
    })


    it('should send an error if no password is supplied', async () => {

      await chai.request(app)
        .post(resetPassword)
        .send({ id: '5c3bcfc1eb99dd0010d335fe', password: '' })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('password')
          expect(res.body.data[0].constraints.isNotEmpty).to.be.equal('password is required')
          expect(res.body.data[0].value).to.be.eql('')
        });
    })

    it('should send an error if no password is supplied', async () => {

      await chai.request(app)
        .post(resetPassword)
        .send({ id: '5c3bcfc1eb99dd0010d335fe', password: '123' })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('password')
          expect(res.body.data[0].constraints.minLength).to.be.equal('password must be longer than or equal to 5 characters')
          expect(res.body.data[0].value).to.be.eql('123')
        });
    })
  })



  describe('Update User API', () => {
    const updatePath = '/v1/auth/update/'
    let id;
    let userToken;

    it('should register a user', async () => {
      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          id = res.body.data.id
          userToken = res.body.data.token;
        });
    })

    it('should send an error for an unverified user that wants to update account', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: 'Access', accountName: "testname", accountNumber: "1234567890"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data.msg).to.be.eql('User not found or account has not been verified')
        });
    })

    it('should send an error if accountNumber is less than 10', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: 'Access', accountName: "testname", accountNumber: "123456789"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('accountNumber')
          expect(res.body.data[0].constraints.length).to.be.eql("accountNumber must be longer than or equal to 10 characters")
          expect(res.body.data[0].value).to.be.eql("123456789")
        });
    })

    it('should send an error if accountNumber is more than 10', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: 'Access', accountName: "testname", accountNumber: "01234567891"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('accountNumber')
          expect(res.body.data[0].constraints.length).to.be.eql("accountNumber must be shorter than or equal to 10 characters")
          expect(res.body.data[0].value).to.be.eql("01234567891")
        });
    })

    it('should send an error if accountNumber was not entered', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: 'Access', accountName: "testname", accountNumber: 123456789
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('accountNumber')
          expect(res.body.data[0].constraints.isNumberString).to.be.eql("accountNumber must be a number string")
          expect(res.body.data[0].value).to.be.eql(123456789)
        });
    })



    it('should return an error if phone number is invalid', async () => {

      return await chai.request(app)
      .put(updatePath + id)
      .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com', password: '1234567', phoneNumber: 'testname'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(4)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.isNumberString).to.eql('phoneNumber must be a number string')
          expect(res.body.data[0].value).to.eql('testname')
        })
    })



    it('should return an error if phone number length is more than 11 characters', async () => {

      return await chai.request(app)
      .put(updatePath + id)
      .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'teastname', email: 'testname@test.quabbly.com', password: '1234567', phoneNumber: '123456789012'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(4)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.length).to.eql('phoneNumber must be shorter than or equal to 11 characters')
          expect(res.body.data[0].value).to.eql('123456789012')
        })
    })


    it('should return an error if phone number length is less than 11 characters', async () => {

      return await chai.request(app)
      .put(updatePath + id)
      .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'teastname', email: 'testname@test.quabbly.com', password: '1234567', phoneNumber: '123456789'
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.be.eql('FAILED_VALIDATION')
          expect(res.body.data).length(4)
          expect(res.body.data[0].property).to.equal('phoneNumber')
          expect(res.body.data[0].constraints.length).to.eql('phoneNumber must be longer than or equal to 11 characters')
          expect(res.body.data[0].value).to.eql('123456789')
        })
    })


    it('should send an error if accountName is less than 3 characters', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: 'Access', accountName: "rt", accountNumber: "1234567890"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('accountName')
          expect(res.body.data[0].constraints.minLength).to.be.eql("accountName must be longer than or equal to 3 characters")
          expect(res.body.data[0].value).to.be.eql('rt')
        });
    })


    it('should send an error if accountName was not entered', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: 'Access', accountName: "", accountNumber: "1234567890"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('accountName')
          expect(res.body.data[0].constraints.isNotEmpty).to.be.eql("accountName is required")
          expect(res.body.data[0].value).to.be.eql('')
        });
    })

    it('should send an error if accountName is more than 30 characters', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: 'Access', accountName: moreThan30CharString, accountNumber: "1234567890"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('accountName')
          expect(res.body.data[0].constraints.maxLength).to.be.eql("accountName must be shorter than or equal to 30 characters")
          expect(res.body.data[0].value).to.be.eql(moreThan30CharString)
        });
    })


    it('should send an error if bankName is more than 30 characters', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: moreThan30CharString, accountName: "sample account", accountNumber: "1234567890"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('bankName')
          expect(res.body.data[0].constraints.maxLength).to.be.eql("bankName must be shorter than or equal to 30 characters")
          expect(res.body.data[0].value).to.be.eql(moreThan30CharString)
        });
    })


    it('should send an error if accountName was not entered', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: '', accountName: "sampleaccount", accountNumber: "1234567890"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('bankName')
          expect(res.body.data[0].constraints.isNotEmpty).to.be.eql("bankName is required")
          expect(res.body.data[0].value).to.be.eql('')
        });
    })


    it('should send an error if bankName is less than 3 characters', async () => {

      return await chai.request(app)
        .put(updatePath + id)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          baseUrl: "http://www.photizzo.com", firstName: 'testname', lastName: 'testname', email: 'testname@test.quabbly.com',
          password: 'quitting', phoneNumber: '08765432134', bankName: 'Ac', accountName: "right", accountNumber: "1234567890"
        })
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data).length(1)
          expect(res.body.data[0].property).to.be.eql('bankName')
          expect(res.body.data[0].constraints.minLength).to.be.eql("bankName must be longer than or equal to 3 characters")
          expect(res.body.data[0].value).to.be.eql('Ac')
        });
    })
  })


  describe('Verify Referral Id API', () => {
    const verifyIdPath = '/v1/auth/verify_id/'
    let validId;

    it('should throw an error for invalid referral link', async () => {
      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          validId = res.body.data.referralId
        });


      return await chai.request(app)
        .post(verifyIdPath + "invalidId")
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.status).to.equal('FAILED_VALIDATION')
          expect(res.body.data.msg).to.be.eql("Invalid referral link")
        });

    })


    it('should show an error message if a user tries to use a referral link for an account that has not been activated', async () => {
      await chai.request(app)
        .post(registerPath)
        .send(registerData)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body.status).to.equal('SUCCESS')
          expect(res.body.data).to.be.an('object')
          validId = res.body.data.referralId
        });

      return await chai.request(app)
        .post(verifyIdPath + validId)
        .then(res => {
          expect(res).to.have.status(412)
          expect(res.body.status).to.equal('PRECONDITION_FAILED')
          expect(res.body.data.msg).to.be.eql("This link's account has not be activated");
        });

    })

  })
});