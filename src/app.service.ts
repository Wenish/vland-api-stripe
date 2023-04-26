import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Money, MoneyDocument } from "./database/schemas/money.schema";
import { Model } from "mongoose";
import * as admin from 'firebase-admin';

Injectable()
export class AppService {
    constructor(
        @InjectModel(Money.name)
        private readonly moneyModel: Model<MoneyDocument>
    ) {}

    async getMoneyByUid(uid: string) {
        const user = await admin.auth().getUser(uid)
        if (!user.uid) throw `No User with ${uid} exists.`
        const money = await this.moneyModel
            .findOne({
                uid: uid
            })
            .exec();

        if (money) return money;

        const newMoney = new this.moneyModel({
            uid: uid
        })
        await newMoney.save();
        return newMoney as MoneyDocument
    }

    async addMoneyByUid(uid: string, moneyToAdd: number) {
        const money = await this.getMoneyByUid(uid)
        const newMoney = await this.moneyModel.findByIdAndUpdate(money._id,
            {
                $inc: { money: moneyToAdd }
            },
            {
                new: true
            })
        return newMoney
    }
}