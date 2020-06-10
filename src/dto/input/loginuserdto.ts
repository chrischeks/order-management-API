import {IsEmail, IsNotEmpty, MaxLength, IsNumberString, Length, ValidateIf, IsOptional, IsNumber} from "class-validator";

export class LoginUserDTO {
 
    @IsEmail()
    @IsNotEmpty({
        message: 'userName is required'
    })
    username: string;

    
    @IsNotEmpty({
        message: 'password is required'
    })
    password: string;





    constructor(username?: string, password?: string){
        this.username = username;
        this.password = password;
    }
}