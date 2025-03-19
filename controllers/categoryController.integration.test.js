import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import JWT from "jsonwebtoken";
import categoryRoutes from "../routes/categoryRoutes.js";
import userModel from "../models/userModel.js";
import categoryModel from "../models/categoryModel.js";

describe("Category Controllers Integration Test", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/category", categoryRoutes);

  let database;

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    const uri = database.getUri();
    await mongoose.connect(uri);
    process.env.JWT_SECRET = "testjwtsecret";
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await database.stop();
  });

  afterEach(async () => {
    await userModel.deleteMany();
    await categoryModel.deleteMany();
  });

  describe("POST /create-category", () => {
    test("should create a new category with valid admin token", async () => {
      const adminUser = await userModel.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password",
        phone: "98765432",
        address: "Singapore",
        answer: "answer",
        role: 1,
      });

      const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", token)
        .send({ name: "Test Category" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("New category created");
      expect(res.body.category).toHaveProperty("name", "Test Category");
      expect(res.body.category).toHaveProperty("slug", "test-category");
    });

    test("should fail without a valid token", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .send({ name: "Test Category" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    test("should fail when name is missing", async () => {
      const adminUser = await userModel.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password",
        phone: "98765432",
        address: "Singapore",
        answer: "answer",
        role: 1,
      });

      const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", token)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Name is required");
    });

    test("should fail with an expired token", async () => {
      const adminUser = await userModel.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password",
        phone: "98765432",
        address: "Singapore",
        answer: "answer",
        role: 1,
      });

      const expiredToken = JWT.sign(
        { _id: adminUser._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "1ms",
        }
      );

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", expiredToken)
        .send({ name: "Test Category" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    test("should fail with an invalid token format", async () => {
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", `Bearer invalidToken`)
        .send({ name: "Test Category" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    test("should fail when category already exists", async () => {
      const adminUser = await userModel.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password",
        phone: "98765432",
        address: "Singapore",
        answer: "answer",
        role: 1,
      });

      const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      await categoryModel.create({
        name: "Existing Category",
        slug: "existing-category",
      });

      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", token)
        .send({ name: "Existing Category" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Category Already Exists");
    });
  });

  describe("PUT /update-category/:id", () => {
    test("should update a category with valid admin token", async () => {
      const adminUser = await userModel.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password",
        phone: "98765432",
        address: "Singapore",
        answer: "answer",
        role: 1,
      });

      const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const category = await categoryModel.create({
        name: "Old Category",
        slug: "old-category",
      });

      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .set("Authorization", token)
        .send({ name: "Updated Category" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category Updated Successfully");
      expect(res.body.category).toHaveProperty("name", "Updated Category");
      expect(res.body.category).toHaveProperty("slug", "updated-category");
    });

    test("should fail without a valid token", async () => {
      const category = await categoryModel.create({
        name: "Old Category",
        slug: "old-category",
      });

      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .send({ name: "Updated Category" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    test("should fail when category does not exist", async () => {
      const adminUser = await userModel.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password",
        phone: "98765432",
        address: "Singapore",
        answer: "answer",
        role: 1,
      });

      const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const nonExistentCategoryId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .put(`/api/v1/category/update-category/${nonExistentCategoryId}`)
        .set("Authorization", token)
        .send({ name: "Updated Category" });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Category not found");
    });
  });

  describe("GET /get-category", () => {
    test("should retrieve all categories", async () => {
      await categoryModel.create({ name: "Category 1", slug: "category-1" });
      await categoryModel.create({ name: "Category 2", slug: "category-2" });

      const res = await request(app).get("/api/v1/category/get-category");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toHaveLength(2);
      expect(res.body.category[0]).toHaveProperty("name", "Category 1");
      expect(res.body.category[0]).toHaveProperty("slug", "category-1");
      expect(res.body.category[1]).toHaveProperty("name", "Category 2");
      expect(res.body.category[1]).toHaveProperty("slug", "category-2");
    });

    test("should returns empty array when no categories exist", async () => {
      const res = await request(app).get("/api/v1/category/get-category");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toHaveLength(0);
    });
  });

  describe("GET /single-category/:slug", () => {
    test("should retrieve a single category", async () => {
      const category = await categoryModel.create({
        name: "Test Category",
        slug: "test-category",
      });

      const res = await request(app).get(
        `/api/v1/category/single-category/${category.slug}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toHaveProperty("name", "Test Category");
      expect(res.body.category).toHaveProperty("slug", "test-category");
    });

    test("should return an error if category does not exist", async () => {
      const res = await request(app).get(
        "/api/v1/category/single-category/non-existent-category"
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Category not found");
    });
  });

  describe("DELETE /delete-category/:id", () => {
    test("should successfully deletes a category with valid admin token", async () => {
      const adminUser = await userModel.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password",
        phone: "98765432",
        address: "Singapore",
        answer: "answer",
        role: 1,
      });

      const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const category = await categoryModel.create({
        name: "Category to Delete",
        slug: "category-to-delete",
      });

      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${category._id}`)
        .set("Authorization", token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category Deleted Successfully");
    });

    test("should fail without a valid token", async () => {
      const category = await categoryModel.create({
        name: "Category to Delete",
        slug: "category-to-delete",
      });

      const res = await request(app).delete(
        `/api/v1/category/delete-category/${category._id}`
      );

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid token");
    });

    test("should fail when category does not exist", async () => {
      const adminUser = await userModel.create({
        name: "Admin",
        email: "admin@test.com",
        password: "password",
        phone: "98765432",
        address: "Singapore",
        answer: "answer",
        role: 1,
      });

      const token = JWT.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      const nonExistentCategoryId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${nonExistentCategoryId}`)
        .set("Authorization", token);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Category not found");
    });
  });
});
