import router from "./categoryRoutes.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

jest.mock("../controllers/categoryController.js", () => ({
  createCategoryController: jest.fn((req, res) =>
    res.send("createCategoryController called")
  ),
  updateCategoryController: jest.fn((req, res) =>
    res.send("updateCategoryController called")
  ),
  categoryController: jest.fn((req, res) =>
    res.send("categoryController called")
  ),
  singleCategoryController: jest.fn((req, res) =>
    res.send("singleCategoryController called")
  ),
  deleteCategoryController: jest.fn((req, res) =>
    res.send("deleteCategoryController called")
  ),
}));

jest.mock("../middlewares/authMiddleware.js");

describe("Category Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when POST /create-category is called", () => {
    test("should call createCategoryController when user is logged in and is an admin", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => next());
      isAdmin.mockImplementationOnce((req, res, next) => next());

      let req = {
        method: "POST",
        url: "/create-category",
        body: { name: "Test Category" },
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).toHaveBeenCalled();

      expect(res.send).toHaveBeenCalledWith("createCategoryController called");
    });

    test("should not call createCategoryController when user is not logged in", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => {});

      let req = {
        method: "POST",
        url: "/create-category",
        body: { name: "Test Category" },
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).not.toHaveBeenCalled();

      expect(res.send).not.toHaveBeenCalled();
    });

    test("should not call createCategoryController when user is not an admin", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => next());
      isAdmin.mockImplementationOnce((req, res, next) => {});

      let req = {
        method: "POST",
        url: "/create-category",
        body: { name: "Test Category" },
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).toHaveBeenCalled();

      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe("when PUT /update-category is called", () => {
    test("should call updateCategoryController when user is logged in and is an admin", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => next());
      isAdmin.mockImplementationOnce((req, res, next) => next());

      let req = {
        method: "PUT",
        url: "/update-category/1",
        body: { name: "Test Category" },
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).toHaveBeenCalled();

      expect(res.send).toHaveBeenCalledWith("updateCategoryController called");
    });

    test("should not call updateCategoryController when user is not logged in", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => {});

      let req = {
        method: "PUT",
        url: "/update-category/1",
        body: { name: "Test Category" },
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).not.toHaveBeenCalled();

      expect(res.send).not.toHaveBeenCalled();
    });

    test("should not call updateCategoryController when user is not an admin", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => next());
      isAdmin.mockImplementationOnce((req, res, next) => {});

      let req = {
        method: "PUT",
        url: "/update-category/1",
        body: { name: "Test Category" },
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).toHaveBeenCalled();

      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe("when GET /get-category is called", () => {
    test("should call categoryController", async () => {
      let req = {
        method: "GET",
        url: "/get-category",
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(res.send).toHaveBeenCalledWith("categoryController called");
    });
  });

  describe("when GET /single-category is called", () => {
    test("should call singleCategoryController", () => {
      let req = {
        method: "GET",
        url: "/single-category/test",
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(res.send).toHaveBeenCalledWith("singleCategoryController called");
    });
  });
  
  describe("when DELETE /delete-category is called", () => {
    test("should call deleteCategoryController when user is logged in and is an admin", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => next());
      isAdmin.mockImplementationOnce((req, res, next) => next());

      let req = {
        method: "DELETE",
        url: "/delete-category/123",
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).toHaveBeenCalled();

      expect(res.send).toHaveBeenCalledWith("deleteCategoryController called");
    });

    test("should not call deleteCategoryController when user is not logged in", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => {});

      let req = {
        method: "DELETE",
        url: "/delete-category/123",
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).not.toHaveBeenCalled();

      expect(res.send).not.toHaveBeenCalled();
    });

    test("should not call deleteCategoryController when user is not an admin", () => {
      requireSignIn.mockImplementationOnce((req, res, next) => next());
      isAdmin.mockImplementationOnce((req, res, next) => {});

      let req = {
        method: "DELETE",
        url: "/delete-category/123",
      };

      let res = {
        send: jest.fn(),
      };

      router.handle(req, res);

      expect(requireSignIn).toHaveBeenCalled();
      expect(isAdmin).toHaveBeenCalled();

      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
