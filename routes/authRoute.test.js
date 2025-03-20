import request from "supertest";
import express from "express";
import authRoute from "./authRoute";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware";
import {
  registerController,
  loginController,
  forgotPasswordController,
  testController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../controllers/authController";

const app = express();
app.use(express.json());
app.use("/", authRoute);

jest.mock("../middlewares/authMiddleware.js");

jest.mock("../controllers/authController.js");

describe("POST /register", () => {
  test("should call registerController and pass the request body", async () => {
    registerController.mockImplementation((req, res) => {
      res.json({ success: true, test: true, reqBody: req.body });
    });

    const response = await request(app).post("/register").send({ email: "email", password: "password" });

    expect(registerController).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ success: true, test: true, reqBody: { email: "email", password: "password" } });
  })
})

describe("POST /login", () => {
  test("should call loginController once and pass request data", async () => {
    loginController.mockImplementation((req, res) => {
      res.json({ success: true, test: true, reqBody: req.body });
    });

    const response = await request(app).post("/login").send({ email: "email", password: "password" });

    expect(loginController).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ success: true, test: true, reqBody: { email: "email", password: "password" } });
  })
})

describe("POST /forgot-password", () => {
  test("should call forgotPasswordController once and pass request data", async () => {
    forgotPasswordController.mockImplementation((req, res) => {
      res.json({ success: true, test: true, reqBody: req.body });
    });

    const response = await request(app).post("/forgot-password").send({ email: "email" });

    expect(forgotPasswordController).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ success: true, test: true, reqBody: { email: "email" } });
  })
})

describe("GET /test", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    requireSignIn.mockImplementation((req, res, next) => {
      req.user = { _id: "123" };
      next();
    });

    isAdmin.mockImplementation((req, res, next) => {
      next();
    });

    testController.mockImplementation((req, res) => {
      res.json({ success: true });
    });
  })

  test("should call requireSignIn, isAdmin and testController", async () => {
    const response = await request(app).get("/test");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(testController).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ success: true });
  })

  test("should fail if requireSignIn failed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).get("/test");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).not.toHaveBeenCalled();
    expect(testController).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })

  test("should fail if isAdmin failed", async () => {
    isAdmin.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).get("/test");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(testController).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })
})

describe("GET /user-auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  })

  test("should return success if requireSignIn passed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      req.user = { _id: "123" };
      next();
    });

    const response = await request(app).get("/user-auth");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  })

  test("should fail if requireSignIn failed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).get("/user-auth");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })
})

describe("GET /admin-auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    requireSignIn.mockImplementation((req, res, next) => {
      req.user = { _id: "123" };
      next();
    });

    isAdmin.mockImplementation((req, res, next) => {
      next();
    });
  })

  test("should return success if requireSignIn and isAdmin passed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      req.user = { _id: "123" };
      next();
    });

    isAdmin.mockImplementation((req, res, next) => {
      next();
    });

    const response = await request(app).get("/admin-auth");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  })

  test("should fail if requireSignIn failed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).get("/admin-auth");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })

  test("should fail if isAdmin failed", async () => {
    isAdmin.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).get("/admin-auth");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })
})

describe("PUT /profile", () => {
  let mockPut = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();

    requireSignIn.mockImplementation((req, res, next) => {
      req.user = { _id: "123" };
      next();
    });

    updateProfileController.mockImplementation((req, res) => {
      mockPut(req.body);
      res.json({ success: true });
    });
  })

  test("should call requireSignIn and updateProfileController", async () => {
    const response = await request(app).put("/profile").send({ name: "name", address: "address" });

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(updateProfileController).toHaveBeenCalledTimes(1);
    expect(mockPut).toHaveBeenCalledWith({ name: "name", address: "address" });
    expect(response.body).toEqual({ success: true });
  })

  test("should fail if requireSignIn failed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).put("/profile");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(updateProfileController).not.toHaveBeenCalled();
    expect(mockPut).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })
})

describe("GET /orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    requireSignIn.mockImplementation((req, res, next) => {
      req.user = { _id: "123" };
      next();
    });

    getOrdersController.mockImplementation((req, res) => {
      res.json({ success: true });
    });
  })

  test("should call requireSignIn and getOrdersController", async () => {
    const response = await request(app).get("/orders");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(getOrdersController).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ success: true });
  })

  test("should fail if requireSignIn failed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).get("/orders");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(getOrdersController).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })
})

describe("GET /all-orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    requireSignIn.mockImplementation((req, res, next) => {
      req.user = { _id: "123" };
      next();
    });

    isAdmin.mockImplementation((req, res, next) => {
      next();
    });

    getAllOrdersController.mockImplementation((req, res) => {
      res.json({ success: true });
    });
  })

  test("should call requireSignIn, isAdmin and getAllOrdersController", async () => {
    const response = await request(app).get("/all-orders");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(getAllOrdersController).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ success: true });
  })

  test("should fail if requireSignIn failed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).get("/all-orders");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).not.toHaveBeenCalled();
    expect(getAllOrdersController).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })

  test("should fail if isAdmin failed", async () => {
    isAdmin.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).get("/all-orders");

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(getAllOrdersController).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })
})

describe("PUT /order-status/:orderId", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    requireSignIn.mockImplementation((req, res, next) => {
      req.user = { _id: "123" };
      next();
    });

    isAdmin.mockImplementation((req, res, next) => {
      next();
    });

    orderStatusController.mockImplementation((req, res) => {
      res.json({ success: true });
    });
  })

  test("should call requireSignIn, isAdmin and orderStatusController and pass data through", async () => {
    orderStatusController.mockImplementation((req, res) => {
      res.json({ success: true, reqBody: req.body });
    })

    const response = await request(app).put("/order-status/123").send({ status: "status" });

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(orderStatusController).toHaveBeenCalledTimes(1);
    expect(response.body).toEqual({ success: true, reqBody: { status: "status" } });
  })

  test("should fail if requireSignIn failed", async () => {
    requireSignIn.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).put("/order-status/123").send({ status: "status" });

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).not.toHaveBeenCalled();
    expect(orderStatusController).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })

  test("should fail if isAdmin failed", async () => {
    isAdmin.mockImplementation((req, res, next) => {
      res.status(401).send({ error: "Not authorized" });
    });

    const response = await request(app).put("/order-status/123").send({ status: "status" });

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(orderStatusController).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Not authorized" });
  })
});
