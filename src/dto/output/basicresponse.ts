import { Status } from "../enums/statusenum";

export class BasicResponse {

    private status: number;
    private data: object;
    private amount: number;

    constructor(status: number, data ?: object, amount?: number){
        this.status = status;
        this.data = data;
        this.amount = amount;
    }
    
    public getData(){
        return this.data;
    }

    public getStatusString() {
        return Status[this.status];
    }

    public getAmount() {
        return this.amount;
    }
    
}