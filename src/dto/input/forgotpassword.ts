import {IsEmail, IsNotEmpty, MinLength, MaxLength, IsUrl} from "class-validator";

export class ForgotPasswordDTO {
 

    @IsEmail()
    @IsNotEmpty({
        message: 'email is required'
    })
    email: string;


    @IsNotEmpty({
        "message": "baseUrl is required"  
      })
    @IsUrl()
    baseUrl: string;




    constructor(email?: string, baseUrl?: string){
        this.email = email;
        this.baseUrl = baseUrl;
    }
}