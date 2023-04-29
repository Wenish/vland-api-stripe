import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type PaymentDocument = Payment & Document;

@Schema({
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
})
export class Payment {
    _id: string;
    __v: string;
    createdAt: Date;
    updatedAt: Date;

    @Prop({ unique: true })
    uid: string;

    @Prop({required: true})
    price: number

    @Prop({required: true})
    currency: string

    @Prop({required: true})
    method: string
}

export const PaymentSchema = SchemaFactory.createForClass(Payment)