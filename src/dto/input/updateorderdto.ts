import {IsEmail, IsNotEmpty, MinLength,IsEnum, MaxLength, IsNumberString, IsOptional, IsNumber} from "class-validator";
import { productTypeValue } from "../../dto/enums/validationenum";
import { statusType } from "../../dto/enums/validationenum";
import { productName } from "../../dto/enums/validationenum";

export class UpdateOrderDTO {

    @IsEnum(productName, {
        message: 'product name should be valid'
    })
    @IsNotEmpty({
        message: 'product name is required'
    })
    productName: string;
 
    @IsEnum(productTypeValue, {
        message: 'product type should be valid'
    })
    @IsNotEmpty({
        message: 'product type is required'
    })
    productType: string;

    @MinLength(3)
    @MaxLength(100)
    firstName: string;

    @MinLength(3)
    @MaxLength(100)
    lastName: string;

    @MinLength(3)
    @MaxLength(14)
    @IsNumberString()
    phoneNumber: string;

    @IsEmail()
    @MinLength(3)
    @MaxLength(100)
    email: string;

    @MinLength(3)
    @MaxLength(1000)
    address: string;

    @IsNumber()
    numberOfItems: number;

    @IsEnum(statusType, {
        message: 'status type should be valid'
    })
    status: string;

    @MinLength(3)
    @MaxLength(50)
    @IsNotEmpty()
    state: string;

    @MinLength(3)
    @MaxLength(50)
    @IsNotEmpty()
    city: string;



    constructor(productName?: string, productType?: string, firstName?: string, lastName?: string, phoneNumber?: string, email?: string, address?: string, numberOfItems?: number, status?: string, state ?: string, city ?: string){
        this.productName = productName;
        this.productType = productType;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.address = address;
        this.numberOfItems = numberOfItems;
        this.status = status;
        this.state = state;
        this.city = city;
    }
}