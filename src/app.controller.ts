import { Body, Controller, Get, Headers, HttpException, Post, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { BearerGuard } from './guards/bearer.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseUser, User } from './decorators/user.decorator';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { ConfigService } from "@nestjs/config";
import { Stripe } from 'stripe';
import * as admin from 'firebase-admin';

@Controller()
export class AppController {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService
  ) {
    const apiKey = this.configService.get<string>('stripe.privateKey')
    this.stripe = new Stripe(apiKey, { apiVersion: '2022-11-15' })
  }

  @Get()
  getHello(): string {
    return '<h1>vland api stripe</h1><p>running...</p><p><a href="/api">Swagger Docs</a>';
  }

  @Get('/users/me/money')
  @UseGuards(BearerGuard)
  @ApiBearerAuth('Bearer Authentication')
  async getUserMoneyByUid(@User() user: FirebaseUser) {
    const money = await this.appService.getMoneyByUid(user.uid)
    return money;
  }

  @Post('/create-checkout-session')
  @UseGuards(BearerGuard)
  @ApiBearerAuth('Bearer Authentication')
  async createCheckoutSession(@Body() createCheckoutSessionDto: CreateCheckoutSessionDto, @User() user: FirebaseUser, @Headers() headers) {
    const origin = headers?.origin
    const product = await this.stripe.products.retrieve(createCheckoutSessionDto.productId, { expand: ['price'] })
    const price = await this.stripe.prices.retrieve(product.id)

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price: price.id
      }],
      success_url: `${origin}/success-payment-strip?points=${product.metadata.points}&pointsBonus=${product.metadata.pointsBonus}`,
      cancel_url: `${origin}/cancel-payment-strip`,
      customer_email: user.email,
      metadata: {
        productId: product.id
      }
    })
    return session
  }

  @Post('/webhook-stripe')
  async webhookStripe(@Headers('stripe-signature') stripeSignature, @Req() request: any) {
      const endpointSecret = this.configService.get('stripe.webhookEndpointSecret')

      let event: Stripe.Event;

      try {
          event = this.stripe.webhooks.constructEvent(request.rawBody, stripeSignature, endpointSecret);
      } catch (err) {
          throw new HttpException(`Webhook Error: ${err.message}`, 400);
      }
      switch (event.type) {
          case 'checkout.session.completed': {
              const eventObject: any = event.data.object;
              // Save an order in your database, marked as 'awaiting payment'
              // createOrder(session);

              // Check if the order is paid (e.g., from a card payment)
              //
              // A delayed notification payment will have an `unpaid` status, as
              // you're still waiting for funds to be transferred from the customer's
              // account.
              const isSessionPayed = eventObject.payment_status === 'paid'
              if (isSessionPayed) {
                  // Fullfill order
                  const session = await this.stripe.checkout.sessions.retrieve(eventObject.id)
                  const { uid } = await admin.auth().getUserByEmail(session.customer_email);
                  const productId = session.metadata.productId;
                  const product = await this.stripe.products.retrieve(productId);
                  const pointsToAdd = parseInt(product.metadata.points, 10) + parseInt(product.metadata.pointsBonus, 10)
                  await this.appService.addMoneyByUid(uid, pointsToAdd)
                  const price = await this.stripe.prices.retrieve(product.id)
                  await this.appService.createPayment({
                    uid: uid,
                    price: price.unit_amount,
                    currency: price.currency,
                    method: 'stripe'
                  })
              }

              break;
          }
      }

  }
}

