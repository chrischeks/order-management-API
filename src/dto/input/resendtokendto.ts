import { IsNotEmpty, IsEmail } from 'class-validator';

export class ResendLinkDTO {

    
    @IsEmail()
    @IsNotEmpty({
        message: 'email is required'
    })
    email: string;


    constructor( email: string){
        this.email = email;
    }
}