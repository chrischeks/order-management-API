import { IsNotEmpty, MinLength, IsMongoId} from "class-validator";

export class ResetPasswordDTO {
 
    @IsNotEmpty({
        "message": "id is required"  
      })
    @IsMongoId()
    id: string;

    @MinLength(5)
    @IsNotEmpty({
        message: 'password is required'
    })
    password: string;




    constructor(id?: string, password?: string){
        this.id = id;
        this.password = password;
        
    }
}