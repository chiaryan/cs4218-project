import express from "express";
import morgan from "morgan";
import connectDB from "../config/db.js";
import authRoutes from "../routes/authRoute.js";
import cors from "cors";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import dotenv from "dotenv";

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//routes
app.use("/api/v1/auth", authRoutes);

describe("POST /api/v1/auth/register", () => {
  let registerData;
  let database;
  // set up database
  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await database.stop();
  });

  beforeEach(() => {
    registerData = {
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
      password: "hashedPassword123",
      answer: "Football",
    };
  });
  test("should fail if name is not provided", async () => {
    registerData.name = "";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Name is Required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if email is not provided", async () => {
    registerData.email = "";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email is Required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if password is not provided", async () => {
    registerData.password = "";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Password is Required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if phone is not provided", async () => {
    registerData.phone = "";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Phone no is Required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if address is not provided", async () => {
    registerData.address = "";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Address is Required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if answer is not provided", async () => {
    registerData.answer = "";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Answer is Required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if email is invalid", async () => {
    registerData.email = "invalidemail";

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid Email");
    expect(response.body.success).toBeFalsy();
  });

  test("should register new user and fail if user already exists", async () => {
    const successResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    const failResponse = await request(app)
      .post("/api/v1/auth/register")
      .send(registerData);

    expect(successResponse.statusCode).toBe(201);
    expect(successResponse.body.message).toBe("User Register Successfully");
    expect(successResponse.body.success).toBeTruthy();
    expect(successResponse.body.user).toBeDefined();

    expect(failResponse.statusCode).toBe(200);
    expect(failResponse.body.message).toBe("Already Register please login");
    expect(failResponse.body.success).toBeFalsy();
  });
});

describe("POST /api/v1/auth/login", () => {
  let database;
  // set up database
  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    await request(app).post("/api/v1/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
      password: "password123",
      answer: "Football",
    });
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await database.stop();
  });

  let loginData;

  beforeEach(() => {
    loginData = {
      email: "john@example.com",
      password: "password123",
    };
  });

  test("should fail if email is not provided", async () => {
    loginData.email = "";

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(loginData);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Invalid email or password");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if password is not provided", async () => {
    loginData.password = "";

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(loginData);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Invalid email or password");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if user is not found", async () => {
    loginData.email = "fakeemail@email.com";
    loginData.password = "password123";

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(loginData);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Email is not registerd");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if password is incorrect", async () => {
    loginData.password = "wrongpassword";

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(loginData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Invalid Password");
    expect(response.body.success).toBeFalsy();
  });

  test("should login user successfully if login info is correct", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(loginData);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("login successfully");
    expect(response.body.success).toBeTruthy();
    expect(response.body.user).toMatchObject({
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
    });
    expect(response.body.token).toBeDefined();
  });
});

describe("POST /api/v1/auth/forgot-password", () => {
  let database;
  // set up database
  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    await request(app).post("/api/v1/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
      password: "password123",
      answer: "Football",
    });
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await database.stop();
  });

  let forgotPasswordData;

  beforeEach(() => {
    forgotPasswordData = {
      email: "john@example.com",
      answer: "Football",
      newPassword: "password456",
    };
  });

  test("should fail if email is not provided", async () => {
    forgotPasswordData.email = "";

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(forgotPasswordData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email is required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if answer is not provided", async () => {
    forgotPasswordData.answer = "";

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(forgotPasswordData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("answer is required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if newPassword is not provided", async () => {
    forgotPasswordData.newPassword = "";

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(forgotPasswordData);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("New Password is required");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if user is not found", async () => {
    forgotPasswordData.email = "fakeemail@email.com";

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(forgotPasswordData);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Wrong Email Or Answer");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if answer is incorrect", async () => {
    forgotPasswordData.answer = "wronganswer";

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(forgotPasswordData);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe("Wrong Email Or Answer");
    expect(response.body.success).toBeFalsy();
  });

  test("should reset password successfully", async () => {
    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(forgotPasswordData);

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: forgotPasswordData.email,
      password: forgotPasswordData.newPassword,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Password Reset Successfully");
    expect(response.body.success).toBeTruthy();

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.message).toBe("login successfully");
    expect(loginResponse.body.success).toBeTruthy();
    expect(loginResponse.body.user).toMatchObject({
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
    });
    expect(loginResponse.body.token).toBeDefined();
  });
});

describe("GET /api/v1/auth/test", () => {
  let database;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    // register normal user
    await request(app).post("/api/v1/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
      password: "password123",
      answer: "Football",
    });

    // register admin user
    await request(app).post("/api/v1/auth/register").send({
      name: "Admin",
      email: "admin@email.com",
      phone: "12344000",
      address: "123 Street",
      password: "password123",
      answer: "Football",
    });
    const admin = await userModel.findOne({
      email: "admin@email.com",
    });
    await userModel.findByIdAndUpdate(admin._id, { role: 1 });
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await database.stop();
  });

  test("should fail if no user is logged in", async () => {
    const response = await request(app).get("/api/v1/auth/test");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if provided token is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/auth/test")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if user is not admin", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "john@example.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/v1/auth/test")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("UnAuthorized Access");
    expect(response.body.success).toBeFalsy();
  });

  test("should pass if user is admin", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "admin@email.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/v1/auth/test")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Protected Routes");
  });
});

describe("GET /api/v1/auth/user-auth", () => {
  let database;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    // register normal user
    await request(app).post("/api/v1/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
      password: "password123",
      answer: "Football",
    });
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await database.stop();
  });

  test("should fail if no user is logged in", async () => {
    const response = await request(app).get("/api/v1/auth/user-auth");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if provided token is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should pass if user is logged in", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "john@example.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/v1/auth/user-auth")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBeTruthy();
  });
});

describe("GET /api/v1/auth/admin-auth", () => {
  let database;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    // register normal user
    await request(app).post("/api/v1/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
      password: "password123",
      answer: "Football",
    });

    // register admin user
    await request(app).post("/api/v1/auth/register").send({
      name: "Admin",
      email: "admin@email.com",
      phone: "12344000",
      address: "123 Street",
      password: "password123",
      answer: "Football",
    });
    const admin = await userModel.findOne({
      email: "admin@email.com",
    });
    await userModel.findByIdAndUpdate(admin._id, { role: 1 });
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoose.connection.close();
    await database.stop();
  });

  test("should fail if no user is logged in", async () => {
    const response = await request(app).get("/api/v1/auth/admin-auth");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if provided token is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if user is not admin", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "john@example.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("UnAuthorized Access");
    expect(response.body.success).toBeFalsy();
  });

  test("should pass if user is admin", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "admin@email.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/v1/auth/admin-auth")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBeTruthy();
  });
});

describe("PUT /api/v1/auth/profile", () => {
  let database;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    // register normal user
    await request(app).post("/api/v1/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      phone: "12344000",
      address: "123 Street",
      password: "password123",
      answer: "Football",
    });
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoose.connection.close();
    await database.stop();
  });

  let updateData;

  beforeEach(() => {
    updateData = {
      name: "John",
      password: "password123",
      phone: "1234567890",
      address: "456 Street",
    };
  });

  test("should fail if no user is logged in", async () => {
    const response = await request(app).put("/api/v1/auth/profile");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if provided token is invalid", async () => {
    const response = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if password is less than 6 characters", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "john@example.com",
      password: "password123",
    });

    updateData.password = "pass";

    const response = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", loginResponse.body.token)
      .send(updateData);

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe(
      "Passsword is required and 6 character long"
    );
  });

  test("should update profile successfully", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "john@example.com",
      password: "password123",
    });

    const response = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", loginResponse.body.token)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.message).toBe("Profile Updated SUccessfully");
    expect(response.body.updatedUser).toMatchObject({
      name: "John",
      phone: "1234567890",
      address: "456 Street",
    });
  });

  test("no change in data not modified", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "john@example.com",
      password: "password123",
    });

    const response = await request(app)
      .put("/api/v1/auth/profile")
      .set("Authorization", loginResponse.body.token)
      .send({});

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBeTruthy();
    expect(response.body.message).toBe("Profile Updated SUccessfully");
    expect(response.body.updatedUser).toMatchObject({
      name: "John",
      phone: "1234567890",
      address: "456 Street",
    });
  });
});

describe("GET /api/v1/auth/orders", () => {
  let database;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    // register normal user
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "CS 4218 Test Account",
      email: "cs4218@test.com",
      password: "cs4218@test.com",
      phone: "81234567",
      address: "1 Computing Drive",
      answer: "password is cs4218@test.com",
    });

    const user = await userModel.findOne({ email: "cs4218@test.com" });

    new orderModel({
      products: [],
      payment: {
        errors: {
          validationErrors: {},
          errorCollections: {
            transaction: {
              validationErrors: {
                amount: [
                  {
                    attribute: "amount",
                    code: "81503",
                    message: "Amount is an invalid format.",
                  },
                ],
              },
              errorCollections: {
                creditCard: {
                  validationErrors: {
                    number: [
                      {
                        attribute: "number",
                        code: "81717",
                        message:
                          "Credit card number is not an accepted test number.",
                      },
                    ],
                  },
                  errorCollections: {},
                },
              },
            },
          },
        },
        params: {
          transaction: {
            amount: "3004.9700000000003",
            paymentMethodNonce: "tokencc_bh_c36kjx_t6mnd5_c2mzrt_7rdc6j_nb4",
            options: {
              submitForSettlement: "true",
            },
            type: "sale",
          },
        },
        message:
          "Amount is an invalid format.\nCredit card number is not an accepted test number.",
        success: false,
      },
      buyer: user._id,
    }).save();
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoose.connection.close();
    await database.stop();
  });

  test("should fail if no user is logged in", async () => {
    const response = await request(app).get("/api/v1/auth/orders");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if provided token is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should return user orders", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "cs4218@test.com",
      password: "cs4218@test.com",
    });

    const response = await request(app)
      .get("/api/v1/auth/orders")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(200);
    for (let order of response.body) {
      expect(order.buyer.name).toBe(loginResponse.body.user.name);
      expect(order.products).toBeDefined();
    }
  });
});

describe("GET /api/v1/auth/all-orders", () => {
  let database;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    // register admin user
    await request(app).post("/api/v1/auth/register").send({
      name: "Admin",
      email: "test@admin.com",
      password: "test@admin.com",
      phone: "12344000",
      address: "123 Street",
      answer: "Football",
    });
    const admin = await userModel.findOne({
      email: "test@admin.com",
    });
    await userModel.findByIdAndUpdate(admin._id, { role: 1 });

    // register normal user
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "CS 4218 Test Account",
      email: "cs4218@test.com",
      password: "cs4218@test.com",
      phone: "81234567",
      address: "1 Computing Drive",
      answer: "password is cs4218@test.com",
    });

    const user = await userModel.findOne({ email: "cs4218@test.com" });

    new orderModel({
      products: [],
      payment: {
        errors: {
          validationErrors: {},
          errorCollections: {
            transaction: {
              validationErrors: {
                amount: [
                  {
                    attribute: "amount",
                    code: "81503",
                    message: "Amount is an invalid format.",
                  },
                ],
              },
              errorCollections: {
                creditCard: {
                  validationErrors: {
                    number: [
                      {
                        attribute: "number",
                        code: "81717",
                        message:
                          "Credit card number is not an accepted test number.",
                      },
                    ],
                  },
                  errorCollections: {},
                },
              },
            },
          },
        },
        params: {
          transaction: {
            amount: "3004.9700000000003",
            paymentMethodNonce: "tokencc_bh_c36kjx_t6mnd5_c2mzrt_7rdc6j_nb4",
            options: {
              submitForSettlement: "true",
            },
            type: "sale",
          },
        },
        message:
          "Amount is an invalid format.\nCredit card number is not an accepted test number.",
        success: false,
      },
      buyer: user._id,
    }).save();
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoose.connection.close();
    await database.stop();
  });

  test("should fail if no user is logged in", async () => {
    const response = await request(app).get("/api/v1/auth/all-orders");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if provided token is invalid", async () => {
    const response = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if user is not admin", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "cs4218@test.com",
      password: "cs4218@test.com",
    });

    const response = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("UnAuthorized Access");
    expect(response.body.success).toBeFalsy();
  });

  test("should return all orders", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "test@admin.com",
      password: "test@admin.com",
    });

    const response = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(200);
  });
});

describe("PUT /api/v1/auth/order-status/:orderId", () => {
  let database;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();

    process.env.MONGO_URL = uri;
    process.env.JWT_SECRET = "testjwtsecret";

    await connectDB();

    // register admin user
    await request(app).post("/api/v1/auth/register").send({
      name: "Admin",
      email: "test@admin.com",
      password: "test@admin.com",
      phone: "12344000",
      address: "123 Street",
      answer: "Football",
    });
    const admin = await userModel.findOne({
      email: "test@admin.com",
    });
    await userModel.findByIdAndUpdate(admin._id, { role: 1 });

    // register normal user
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "CS 4218 Test Account",
      email: "cs4218@test.com",
      password: "cs4218@test.com",
      phone: "81234567",
      address: "1 Computing Drive",
      answer: "password is cs4218@test.com",
    });

    const user = await userModel.findOne({ email: "cs4218@test.com" });

    new orderModel({
      products: [],
      payment: {
        errors: {
          validationErrors: {},
          errorCollections: {
            transaction: {
              validationErrors: {
                amount: [
                  {
                    attribute: "amount",
                    code: "81503",
                    message: "Amount is an invalid format.",
                  },
                ],
              },
              errorCollections: {
                creditCard: {
                  validationErrors: {
                    number: [
                      {
                        attribute: "number",
                        code: "81717",
                        message:
                          "Credit card number is not an accepted test number.",
                      },
                    ],
                  },
                  errorCollections: {},
                },
              },
            },
          },
        },
        params: {
          transaction: {
            amount: "3004.9700000000003",
            paymentMethodNonce: "tokencc_bh_c36kjx_t6mnd5_c2mzrt_7rdc6j_nb4",
            options: {
              submitForSettlement: "true",
            },
            type: "sale",
          },
        },
        message:
          "Amount is an invalid format.\nCredit card number is not an accepted test number.",
        success: false,
      },
      buyer: user._id,
    }).save();
  });

  // close the database connection
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await mongoose.connection.close();
    await database.stop();
  });

  test("should fail if no user is logged in", async () => {
    const response = await request(app).put("/api/v1/auth/order-status/1");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if provided token is invalid", async () => {
    const response = await request(app)
      .put("/api/v1/auth/order-status/1")
      .set("Authorization", "Bearer invalidtoken");

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid token");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if user is not admin", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "cs4218@test.com",
      password: "cs4218@test.com",
    });

    const response = await request(app)
      .put("/api/v1/auth/order-status/1")
      .set("Authorization", loginResponse.body.token);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("UnAuthorized Access");
    expect(response.body.success).toBeFalsy();
  });

  test("should fail if order is not found", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "test@admin.com",
      password: "test@admin.com",
    });

    const response = await request(app)
      .put("/api/v1/auth/order-status/000000000000000000000001")
      .set("Authorization", loginResponse.body.token);

    expect(response.body).toBe(null);
  });

  test("should update order status", async () => {
    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: "test@admin.com",
      password: "test@admin.com",
    });

    const { body: orders } = await request(app)
      .get("/api/v1/auth/all-orders")
      .set("Authorization", loginResponse.body.token);

    const response = await request(app)
      .put(`/api/v1/auth/order-status/${orders[0]._id}`)
      .send({ status: "Processing" })
      .set("Authorization", loginResponse.body.token);
    const updatedOrder = await orderModel.findById(orders[0]._id);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("Processing");

    expect(updatedOrder.status).toBe("Processing");

    await orderModel.findByIdAndUpdate(orders[0]._id, {
      status: orders[0].status,
    });
  });
});
