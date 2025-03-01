import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "./authHelper";

jest.mock("bcrypt");

describe("authHelper hashPassword test", () => {
  test("should return a hashed password", async () => {
    bcrypt.hash.mockResolvedValue("hashedPassword");
    const hashedPassword = await hashPassword("password");
    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    expect(hashedPassword).toBe("hashedPassword");
  });

  test("should handle error", async () => {
    bcrypt.hash.mockRejectedValue("Error");
    const hashedPassword = await hashPassword("password");
    expect(hashPassword).not.toThrow();
  });
});

describe("authHelper comparePassword test", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    bcrypt.compare = jest
      .fn()
      .mockImplementation((password, hash) => hash === "hashedPassword");
  });

  test("should return true if password match hash", async () => {
    const isMatch = await comparePassword("password", "hashedPassword");

    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    expect(isMatch).toBeTruthy();
  });

  test("should return false if password does not match hash", async () => {
    const isMatch = await comparePassword("password", "wrongHash");

    expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    expect(isMatch).toBeFalsy();
  });
});
