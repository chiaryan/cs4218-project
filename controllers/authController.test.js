import userModel from "../models/userModel";
import JWT from "jsonwebtoken";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "./authController";
import orderModel from "../models/orderModel";

jest.mock("../helpers/authHelper.js", () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock("../models/userModel.js");
jest.mock("../models/orderModel.js");
jest.mock("jsonwebtoken");

describe("Register Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        phone: "12344000",
        address: "123 Street",
        password: "hashedPassword123",
        answer: "Football",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("user model is not saved for invalid email", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();
    req.body.email = "invalid-email";

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Invalid Email" });
  });

  test("returns error if name is missing", async () => {
    req.body.name = "";

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is Required" });
  });

  test("returns error if email is missing", async () => {
    req.body.email = "";

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
  });

  test("returns error if password is missing", async () => {
    req.body.password = "";

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Password is Required",
    });
  });

  test("returns error if phone is missing", async () => {
    req.body.phone = "";

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Phone no is Required",
    });
  });

  test("returns error if address is missing", async () => {
    req.body.address = "";

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Address is Required",
    });
  });

  test("returns error if answer is missing", async () => {
    req.body.answer = "";

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Answer is Required",
    });
  });

  test("returns unsuccess registration if user already exists", async () => {
    let email = "john@example.com";
    userModel.findOne = jest.fn().mockResolvedValue({ ...req.body });
    req.body.email = email;

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Already Register please login",
    });
  });

  test("registers user successfully", async () => {
    let user = { ...req.body };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn().mockResolvedValue(user);

    hashPassword.mockResolvedValueOnce("hashedPassword123");

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "User Register Successfully",
      user: user,
    });
  });

  test("handles server error", async () => {
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Server Error"));

    await registerController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Errro in Registeration",
      error: new Error("Server Error"),
    });
  });
});

describe("Login controller test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        email: "john@example.com",
        password: "password123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("returns error if email is missing", async () => {
    req.body.email = "";

    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  test("returns error if password is missing", async () => {
    req.body.password = "";

    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  test("returns error if user is not found", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);

    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registerd",
    });
  });

  test("returns error if password is incorrect", async () => {
    userModel.findOne = jest.fn().mockResolvedValue({ password: "password" });

    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Password",
    });
  });

  test("returns token if login is successful", async () => {
    let user = {
      _id: "123",
      ...req.body,
    };
    userModel.findOne = jest.fn().mockResolvedValue(user);

    comparePassword.mockResolvedValue(true);
    JWT.sign = jest.fn().mockResolvedValue("token");

    await loginController(req, res);
    expect(comparePassword).toHaveBeenCalledWith(
      req.body.password,
      user.password
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "login successfully",
      token: "token",
      user: expect.objectContaining({
        _id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        role: user.role,
      }),
    });
  });

  test("handles server error", async () => {
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Server Error"));

    await loginController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in login",
      error: new Error("Server Error"),
    });
  });
});

describe("Forgot Password Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        email: "john@example.com",
        answer: "What answer?",
        newPassword: "password123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("returns error if email is missing", async () => {
    req.body.email = "";

    await forgotPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "Email is required" });
  });

  test("returns error if answer is missing", async () => {
    req.body.answer = "";

    await forgotPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: "answer is required" });
  });

  test("returns error if newPassword is missing", async () => {
    req.body.newPassword = "";

    await forgotPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "New Password is required",
    });
  });

  test("returns error if user is not found", async () => {
    userModel.findOne = jest.fn().mockResolvedValue(null);

    await forgotPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Wrong Email Or Answer",
    });
  });

  test("resets password successfully", async () => {
    let user = { ...req.body, _id: "123" };
    userModel.findOne = jest.fn().mockResolvedValue(user);
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(user);

    hashPassword.mockResolvedValueOnce("hashedPassword123");

    await forgotPasswordController(req, res);
    expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(user._id, {
      password: "hashedPassword123",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Password Reset Successfully",
    });
  });

  test("handles server error", async () => {
    userModel.findOne = jest.fn().mockRejectedValue(new Error("Server Error"));

    await forgotPasswordController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Something went wrong",
      error: new Error("Server Error"),
    });
  });
});

describe("Protected test controller", () => {
  test("returns message", () => {
    let req = {};
    let res = {
      send: jest.fn(),
    };

    testController(req, res);
    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });

  xtest("handles error", () => {
    let req = {};
    let res = {
      send: jest.fn(() => {
        throw new Error("Server Error");
      }),
    };

    testController(req, res);
    expect(res.send).toHaveBeenCalledWith({ error: new Error("Server Error") });
  });
});

describe("Profile update controller test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        _id: "123",
        name: "John Doe",
        email: "john@example.com",
        phone: "12344000",
        address: "123 Street",
        password: "password123",
      },
      // user object from requireSignIn middleware
      user: {
        _id: "123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    let user = { ...req.body };
    userModel.findById = jest.fn().mockResolvedValue(user);
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(user);
  });

  test("returns error if user is not found", async () => {
    userModel.findById = jest.fn().mockResolvedValue(null);

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: "User Not Found" });
  });

  test("returns error if password is less than 6 characters", async () => {
    req.body.password = "123";

    await updateProfileController(req, res);
    expect(res.json).toHaveBeenCalledWith({
      error: "Passsword is required and 6 character long",
    });
  });

  test("returns success message if profile is updated", async () => {
    let user = { ...req.body };

    hashPassword.mockResolvedValueOnce("hashedPassword123");

    await updateProfileController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser: expect.objectContaining(user),
    });
  });

  test("returns saved user data if not provided", async () => {
    let user = { 
      _id: "123",
      name: "Khai",
      email: "user@email.com",
      phone: "12345678",
      address: "26 Street",
    };
    
    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue(user);
    req.body = {_id: "123"};

    await updateProfileController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser: user,
    });
  })

  test("handles server error", async () => {
    userModel.findById = jest.fn().mockRejectedValue(new Error("Server Error"));

    await updateProfileController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Update profile",
      error: new Error("Server Error"),
    });
  });
});

describe("Get Orders Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: "123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    
  });

  test("returns orders successfully", async () => {
    const orders = [
      {
        _id: "order1",
        buyer: { _id: "123", name: "John Doe" },
        products: [{ _id: "product1", name: "Product 1" }],
      },
    ];

    orderModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue(orders),
      }),
    });

    await getOrdersController(req, res);
    expect(orderModel.find).toHaveBeenCalledWith({ buyer: req.user._id });
    expect(res.json).toHaveBeenCalledWith(orders);
  });

  test("handles server error", async () => {
    orderModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error("Server Error")),
      }),
    });

    await getOrdersController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Geting Orders",
      error: new Error("Server Error"),
    });
  });
});

describe("Get All Orders Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: "123",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  test("returns all orders successfully", async () => {
    const orders = [
      {
        _id: "order1",
        buyer: { _id: "123", name: "John Doe" },
        products: [{ _id: "product1", name: "Product 1" }],
      },
    ];
    const sortSpy = jest.fn().mockReturnValue(orders);

    orderModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: sortSpy,
        }),
      }),
    });

    await getAllOrdersController(req, res);
    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(sortSpy).toHaveBeenCalledWith({ createdAt: "-1" });
    expect(res.json).toHaveBeenCalledWith(orders);
  });

  test("handles server error", async () => {
    orderModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error("Server Error")),
        }),
      }),
    });

    await getAllOrdersController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Geting Orders",
      error: new Error("Server Error"),
    });
  });
});

describe("Order Status Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {
        orderId: "order1",
      },
      body: {
        status: "Shipped",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
  });

  test("returns updated order status", async () => {
    const order = {
      _id: "order1",
      buyer: { _id: "123", name: "John Doe" },
      products: [{ _id: "product1", name: "Product 1" }],
      status: "Shipped",
    };

    orderModel.findByIdAndUpdate = jest.fn().mockResolvedValue(order);

    await orderStatusController(req, res);
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      req.params.orderId,
      { status: req.body.status },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(order);
  });

  test("handles server error", async () => {
    orderModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("Server Error"));

    await orderStatusController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Updateing Order",
      error: new Error("Server Error"),
    });
  });
});
