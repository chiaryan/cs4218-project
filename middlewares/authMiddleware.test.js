import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import { requireSignIn, isAdmin } from "./authMiddleware";
import exp from "constants";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("requireSignIn middleware test", () => {
  let req, res, next;
  beforeEach(() => {
    req = {
      headers: {
        authorization: "Bearer token",
      },
    }

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }

    next = jest.fn();
  })

  test("should call next and set req.user if token is valid", async () => {
    JWT.verify.mockReturnValue({ _id: "id" });
    await requireSignIn(req, res, next);

    expect(req.user).toEqual({ _id: "id" });
    expect(next).toHaveBeenCalled();
  })

  test("should not call next nor set req.user if token is invalid", async () => {
    JWT.verify.mockImplementation(() => {
      throw new Error();
    });

    await requireSignIn(req, res, next);

    expect(req).not.toHaveProperty('user');
    expect(next).not.toHaveBeenCalled();
  })
})

describe("isAdmin middleware test", () => {
  let req, res, next;
  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      user: {
        _id: "id",
      }
    }

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }

    next = jest.fn();
  })

  test("should call next if user is admin", async () => {
    userModel.findById.mockResolvedValue({ role: 1 }); // role 1 is admin

    await isAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("should return 401 if user is not admin", async () => {
    userModel.findById.mockResolvedValue({ role: 0 }); // role 0 is not admin

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "UnAuthorized Access",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("should return 401 if error occurs", async () => {
    userModel.findById.mockRejectedValue("error");

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: "error",
      message: "Error in admin middleware",
    });
    expect(next).not.toHaveBeenCalled();
  })
});
