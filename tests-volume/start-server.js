import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import { fstat, readFileSync } from "fs";
const PRODUCT_COUNT = 1_000;
const BATCH_SIZE = 100_000
var photo

async function insertCategories() {
    const categories = Array.from({ length: 100 }, (_, i) => ({
        name: `Category ${i + 1}`,
        slug: `category-${i + 1}`,
    }));
    await categoryModel.insertMany(categories);
    return await categoryModel.find({}).select("id");
}

async function insertProducts(categories) {
    for (let j = 0; j < PRODUCT_COUNT; j += BATCH_SIZE) {
        const products = Array.from({ length: Math.min(BATCH_SIZE, PRODUCT_COUNT - j) }, (_, i) => ({
            name: `Product ${j + i + 1}`,
            slug: `product-${j + i + 1}`,
            description: `Description for product ${i + 1}`,
            quantity: j + i,
            shipping: (j + i) % 2,
            price: (j+i+1) % 110,
            category: categories[(j+i) % (categories.length)]._id,
            photo: (j + i) % 10 == 0 ? {
                data: photo,
                contentType: 'image/png'
            } : undefined
        }));
        await productModel.insertMany(products);
        console.log(`inserted ${j + products.length}/${PRODUCT_COUNT} products`)
    }
}

async function start() {
    const mongoServer = await MongoMemoryServer.create({
        instance: {
            dbPath: "./tests-volume/data",
            port: 12345
        }
    });
    const mongoUri = mongoServer.getUri();
    console.log(`MongoDB is running at ${mongoUri}`);
    const args = process.argv.slice(2);
    const shouldPopulate = args.includes("--populate");
    if (!shouldPopulate) {
        return;
    }
    console.log("connecting");
    await mongoose.connect(mongoUri);
    photo = readFileSync('./tests-volume/picture.png', {
        flag: 'r'
    });
    
    console.log("Clearing database");
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    console.log("inserting categories");
    const categories = await insertCategories();
    console.log(JSON.stringify(categories.map(c => c.id).slice(0, 3)))
    console.log("inserting products");
    await insertProducts(categories);
    console.log("finished inserting, server is running");

}

start()