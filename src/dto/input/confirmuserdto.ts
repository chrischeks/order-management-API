import {IsEmail, IsNotEmpty} from "class-validator";

export class ConfirmUserDTO {


    @IsNotEmpty({
        message: 'token is required'
    })
    token: string;


    constructor( token?: string){
        this.token = token;
    }
}