import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MoneyDocument = Money & Document;

@Schema({
    timestamps: {
        createdAt: true,
        updatedAt: true
    }
})
export class Money {
    _id: string;
    __v: string;
    createdAt: Date;
    updatedAt: Date;

    @Prop({ required: true, unique: true })
    uid: string;

    @Prop({required: true, default: 0})
    money: number
}

export const MoneySchema = SchemaFactory.createForClass(Money)