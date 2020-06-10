import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsNumberString, IsOptional, IsUrl, IsMongoId, Length } from 'class-validator';

export class UpdateUserDTO {
 

    @MinLength(3)
    @MaxLength(30)
    @IsNotEmpty({
        message: 'firstName is required'
    })
    firstName: string;

    @MinLength(3)
    @MaxLength(30)
    @IsNotEmpty({
        message: 'lastName is required'
    })
    lastName: string;

    @IsNumberString()
    @IsOptional()
    @Length(11,11)
    phoneNumber: string;

    @IsNotEmpty({
        "message": "id is required"  
      })
    @IsMongoId()
    id: string;

    
    @MinLength(3)
    @MaxLength(30)
    @IsNotEmpty({
        message: 'accountName is required'
    })
    accountName: string;

    
    @IsNumberString()
    @Length(10,10)
    accountNumber: string;

    @MinLength(3)
    @MaxLength(30)
    @IsNotEmpty({
        message: 'bankName is required'
    })
    bankName: string;




    constructor(firstName?: string, lastName?: string, phoneNumber?:string, id?: string, accountName?: string, accountNumber?: string, bankName?: string){
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.id = id;
        this.accountName = accountName;
        this.accountNumber = accountNumber;
        this.bankName = bankName
    }
}