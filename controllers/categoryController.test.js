import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} from "../controllers/categoryController.js";

jest.mock("../models/categoryModel.js");
jest.mock("slugify", () => jest.fn());

describe("Category Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("createCategoryController", () => {
    test("should return status 400 if name is missing", async () => {
      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    });

    test("should return status 200 if category already exists", async () => {
      req.body.name = "Test Category";
      categoryModel.findOne.mockResolvedValue({ name: "Test Category" });

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        name: "Test Category",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Already Exists",
      });
    });

    test("should return status 201 if a new category is created successfully", async () => {
      req.body.name = "C";
      categoryModel.findOne.mockResolvedValue(null);
      slugify.mockReturnValue("c");

      const mockSave = jest.fn().mockResolvedValue({
        name: "C",
        slug: "c",
      });

      categoryModel.mockImplementation(() => ({ save: mockSave }));

      await createCategoryController(req, res);

      expect(categoryModel).toHaveBeenCalled();
      expect(categoryModel.findOne).toHaveBeenCalled();

      expect(slugify).toHaveBeenCalledWith("C", { lower: true });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "New category created",
        category: { name: "C", slug: "c" },
      });
    });

    test("should return status 500 when an error occurs", async () => {
      req.body.name = "Test Category";
      categoryModel.findOne.mockRejectedValue(new Error("Test error"));

      await createCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error in Category",
      });
    });
  });

  describe("updateCategoryController", () => {
    test("should return status 400 if name is missing", async () => {
      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
    });

    test("should return status 200 and update category", async () => {
      req.body.name = "C";
      req.params.id = "123";
      slugify.mockReturnValue("c");

      categoryModel.findById.mockResolvedValue({
        id: "123",
        name: "C",
        slug: "c",
      });

      categoryModel.findByIdAndUpdate.mockResolvedValue({
        id: "123",
        name: "C",
        slug: "c",
      });

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "123",
        { name: "C", slug: "c" },
        { new: true }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Updated Successfully",
        category: { id: "123", name: "C", slug: "c" },
      });
    });

    test("should return status 404 if the target category does not exist", async () => {
      req.params.id = "123";
      req.body.name = "Test Category";
      categoryModel.findById.mockResolvedValue(null);

      await updateCategoryController(req, res);

      expect(categoryModel.findById).toHaveBeenCalledWith("123");

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category not found",
      });
    });

    test("should return status 500 if an error occurs", async () => {
      req.body.name = "Test Category";
      req.params.id = "456";
      categoryModel.findById.mockResolvedValue(true);
      categoryModel.findByIdAndUpdate.mockRejectedValue(
        new Error("Update failed")
      );

      await updateCategoryController(req, res);

      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error while updating category",
      });
    });
  });

  describe("categoryController", () => {
    test("should return status 200 and return all categories", async () => {
      categoryModel.find.mockResolvedValue([
        { name: "Test Category 1", slug: "test-category-1" },
        { name: "Test Category 2", slug: "test-category-2" },
      ]);

      await categoryController(req, res);

      expect(categoryModel.find).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "All Categories List",
        category: [
          { name: "Test Category 1", slug: "test-category-1" },
          { name: "Test Category 2", slug: "test-category-2" },
        ],
      });
    });

    test("should return status 500 when an error occurs", async () => {
      categoryModel.find.mockRejectedValue(new Error("Test error"));

      await categoryController(req, res);

      expect(categoryModel.find).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error while getting all categories",
      });
    });
  });

  describe("singleCategoryController", () => {
    test("should return status 200 and return a single category", async () => {
      req.params.slug = "test-category";
      categoryModel.findOne.mockResolvedValue({
        name: "Test Category",
        slug: "test-category",
      });

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "test-category",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Get Single Category Successfully",
        category: { name: "Test Category", slug: "test-category" },
      });
    });

    test("should return status 404 if the target category does not exist", async () => {
      req.params.slug = "test-category";
      categoryModel.findOne.mockResolvedValue(null);

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "test-category",
      });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category not found",
      });
    });

    test("should return status 500 if an error occurs", async () => {
      req.params.slug = "unknown";
      categoryModel.findOne.mockRejectedValue(new Error("Not found"));

      await singleCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error while getting Single Category",
      });
    });
  });

  describe("deleteCategoryController", () => {
    test("should return status 200 if the category is deleted successfully", async () => {
      req.params.id = "456";
      categoryModel.findByIdAndDelete.mockResolvedValue(true);

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("456");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category Deleted Successfully",
      });
    });

    test("should return status 404 if the target category does not exist", async () => {
      req.params.id = "456";
      categoryModel.findById.mockResolvedValue(null);

      await deleteCategoryController(req, res);

      expect(categoryModel.findById).toHaveBeenCalledWith("456");

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category not found",
      });
    });

    test("should return status 500 if error occurs", async () => {
      req.params.id = "789";
      categoryModel.findById.mockResolvedValue(true);
      categoryModel.findByIdAndDelete.mockRejectedValue(
        new Error("Delete error")
      );

      await deleteCategoryController(req, res);

      expect(categoryModel.findByIdAndDelete).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while deleting category",
        error: expect.any(Error),
      });
    });
  });
});
