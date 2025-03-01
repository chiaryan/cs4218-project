import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import categoryModel from "./categoryModel";

describe("Category Model", () => {
  let tempMongoDbServer;

  beforeAll(async () => {
    tempMongoDbServer = await MongoMemoryServer.create();
    const uri = tempMongoDbServer.getUri();
    await mongoose.connect(uri);
    await categoryModel.syncIndexes();
  });

  beforeEach(async () => {
    await categoryModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await tempMongoDbServer.stop();
  });

  test("should throw a validation error if name is missing", () => {
    const category = new categoryModel({ slug: "test-category" });

    const error = category.validateSync();

    expect(error.errors.name).toBeDefined();
    expect(error.errors.name.path).toBe("name");
    expect(error.errors.name.kind).toBe("required");
  });

  test("should throw an error when saving a duplicate name", async () => {
    await categoryModel.create({
      name: "Duplicate Name",
      slug: "duplicate-name",
    });

    let error;
    try {
      await categoryModel.create({
        name: "Duplicate Name",
        slug: "duplicate-name",
      });
    } catch (err) {
      console.log(err);
      error = err;
    }

    expect(await categoryModel.countDocuments()).toBe(1);
    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });

  test("should change the slug to lowercase", async () => {
    const category = await categoryModel.create({
      name: "TEST CATEGORY",
      slug: "TEST-CATEGORY",
    });

    expect(category.slug).toBe("test-category");
  });

  test("should pass validation with a valid name and slug", () => {
    const category = new categoryModel({
      name: "Valid Category",
      slug: "valid-category",
    });

    const error = category.validateSync();

    expect(error).toBeUndefined();
  });
});
