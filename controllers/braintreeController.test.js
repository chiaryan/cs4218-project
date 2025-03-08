import orderModel from "../models/orderModel.js";

import braintree from "braintree";
import { braintreeTokenController, brainTreePaymentController } from "./productController.js";

const saveable = {
  save: jest.fn().mockResolvedValue('ok')
}
const res = {
  status: jest.fn(() => res),
  send: jest.fn(),
  json: jest.fn(),
  set: jest.fn(),
}

var gateway;

jest.mock('mongoose')
jest.mock('braintree', () => ({
  Environment: {
    Sandbox: 'lol'
  },
  BraintreeGateway: jest.fn().mockReturnValue({
    clientToken: {
      generate: jest.fn()
    },
    transaction: {
      sale: jest.fn()
    },
  }),
}));
jest.mock("../models/productModel");
jest.mock("../models/categoryModel");
jest.mock("../models/orderModel", () => jest.fn())

beforeAll(() => {
  orderModel.mockReturnValue(saveable);
  [{value: gateway}] = braintree.BraintreeGateway.mock.results;
})

beforeEach(() => {

  jest.clearAllMocks();
})

describe('Given braintreeTokenController', () => {
  it.skip('gateway constructor was called', () => {

    expect(braintree.BraintreeGateway).toHaveBeenCalledWith({
      environment: 'lol',
      merchantId: undefined,
      publicKey: undefined,
      privateKey: undefined,
    })
  })

  it('When it is requested to generate a client token', async () => {
    const token = { clientToken: 'token' };

    gateway.clientToken.generate.mockResolvedValueOnce('ok');
    
    await braintreeTokenController(null, res);
    const [[opts, callback]] = gateway.clientToken.generate.mock.calls;
    callback(null, token);

    expect(res.send).toHaveBeenCalledWith(token);
    const [{value: promise}] = gateway.clientToken.generate.mock.results;
    expect(promise).resolves.not.toThrow();

    // expect(opts).toStrictEqual({});
  })

  it('When generate() throws an error', async () => {
    gateway.clientToken.generate.mockImplementationOnce(() => {throw 'err';});
    
    expect(braintreeTokenController(null, res)).resolves.not.toThrow;
  })

  it('When callback is called with error', async () => {
    await braintreeTokenController(null, res);
    const [[opts, callback]] = gateway.clientToken.generate.mock.calls;
    callback('err', null);

    expect(res.send).toHaveBeenCalledWith('err')
    expect(res.status).toHaveBeenCalledWith(500)
  })
})

describe('Given brainTreePaymentController', () => {
  const SAMPLE_PRODUCTS = [
    {
      _id: "66db427fdb0119d9234b27f3",
      name: "Laptop",
      slug: "laptop",
      description: "A powerful laptop",
      price: 1499.99,
      category: "66db427fdb0119d9234b27ed",
      quantity: 30,
      shipping: true,
    },
    {
      _id: "66db427fdb0119d9234b27f5",
      name: "Smartphone",
      slug: "smartphone",
      description: "A high-end smartphone",
      price: 999.99,
      category: "66db427fdb0119d9234b27ed",
      quantity: 50,
      shipping: false,
    }
  ]

  const req = {
    body: {
      nonce: 'client-nonce',
      cart: SAMPLE_PRODUCTS,
    },
    user: {
      _id: 'user id',
    }
  }

  it('When it is given a cart of items', async () => {
    const paymentResult = {
      success: false,
      message: 'Amount is an invalid format. Credit card number is not an accepted test number.'
    };
    await brainTreePaymentController(req, res);

    const [[{amount, ...opts}, callback]] = gateway.transaction.sale.mock.calls;
    callback(null, paymentResult)


    expect(amount).toBeCloseTo(2499.98)
    expect(opts).toStrictEqual({
      paymentMethodNonce: 'client-nonce',
      options: {
        submitForSettlement: true,
      }
    })

    expect(orderModel).toHaveBeenCalledWith({
      products: SAMPLE_PRODUCTS,
      payment: paymentResult,
      buyer: 'user id'
    })
    expect(saveable.save).toHaveBeenCalled()

    expect(res.json).toHaveBeenCalledWith({ok: true})
  })

  it('When sale() throws an error', async () => {
    gateway.transaction.sale.mockImplementationOnce(() => {throw 'err';});
    
    await expect(brainTreePaymentController(req, res)).resolves.not.toThrow();
    
    expect(gateway.transaction.sale).toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  })

  it('When callback is called with error', async () => {
    await brainTreePaymentController(req, res);
    const [[opts, callback]] = gateway.transaction.sale.mock.calls;
    callback('err', null);

    expect(res.send).toHaveBeenCalledWith('err')
    expect(res.status).toHaveBeenCalledWith(500)
  })
})