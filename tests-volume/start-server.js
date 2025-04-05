import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

async function insertCategories() {
    const categories = Array.from({ length: 100 }, (_, i) => ({
        name: `Category ${i + 1}`,
        slug: `category-${i + 1}`,
    }));
    await categoryModel.insertMany(categories);
    return await categoryModel.find({}).select("id");
}

async function insertProducts(categories) {
    const products = Array.from({ length: 200 }, (_, i) => ({
        name: `Product ${i + 1}`,
        slug: `product-${i + 1}`,
        description: `Description for product ${i + 1}`,
        quantity: 100,
        shipping: i % 2,
        price: i+1,
        category: categories[i % (categories.length)]._id,
    }));
    await productModel.insertMany(products);
}

async function start() {
    const mongoServer = await MongoMemoryServer.create({
        instance: {
            dbPath: "./tests-volume/data",
        }
    });
    const mongoUri = mongoServer.getUri();
    console.log(`MongoDB is running at ${mongoUri}`);

    await mongoose.connect(mongoUri);

    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    const cats = await insertCategories();
    await insertProducts(cats);

    console.log(await productModel.find({}).limit(10))
}

start()
