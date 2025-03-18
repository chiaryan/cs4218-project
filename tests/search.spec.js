import { test, expect } from "@playwright/test";

test.describe("Searching for products when not logged in", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/");
  });

  test("should return correct number of products", async ({ page }) => {
    await page.route("**/api/v1/product/search/book", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            _id: "1",
            name: "Book 1",
            description: "This is Book 1",
            price: 30,
            slug: "book-1",
          },
          {
            _id: "2",
            name: "Book 2",
            description: "This is Book 2",
            price: 40,
            slug: "book-1",
          },
        ]),
      });
    });

    await page.getByRole("searchbox", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: "Search" }).fill("book");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.locator("h1")).toHaveText("Search Results");
    await expect(page.locator("h6")).toContainText("Found 2");
  });

  test("should return nothing when no products are found", async ({ page }) => {
    await page.route("**/api/v1/product/search/nothing", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([]),
      });
    });

    await page.getByRole("searchbox", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: "Search" }).fill("nothing");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.locator("h1")).toHaveText("Search Results");
    await expect(page.locator("h6")).toContainText("No Products Found");
  });

  test.describe("should return products", () => {
    test("that allow users to view more details", async ({ page }) => {
      await page.route("**/api/v1/product/search/book", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              _id: "1",
              name: "Book 1",
              description: "This is Book 1",
              price: 30,
              slug: "book-1",
            },
            {
              _id: "2",
              name: "Book 2",
              description: "This is Book 2",
              price: 40,
              slug: "book-2",
            },
          ]),
        });
      });

      await page.route("**/api/v1/product/get-product/book-1", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Single Product Fetched",
            product: {
              _id: "1",
              name: "Book 1",
              description: "This is Book 1",
              price: 30,
              slug: "book-1",
            },
          }),
        });
      });

      await page.getByRole("searchbox", { name: "Search" }).click();
      await page.getByRole("searchbox", { name: "Search" }).fill("book");
      await page.getByRole("button", { name: "Search" }).click();
      await expect(page.locator("h1")).toHaveText("Search Results");
      await page.getByRole("button", { name: "More Details" }).first().click();

      await expect(page.locator("h1")).toContainText("Product Details");
      await expect(page.locator("h6", { hasText: "Name" })).toContainText(
        "Book 1"
      );
    });

    test("that allow users to add them to their cart", async ({ page }) => {
      await page.route("**/api/v1/product/search/laptop", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              _id: "1",
              name: "Laptop",
              description: "This is a laptop",
              price: 1300,
              slug: "laptop",
            },
          ]),
        });
      });

      await page.getByRole("searchbox", { name: "Search" }).click();
      await page.getByRole("searchbox", { name: "Search" }).fill("laptop");
      await page.getByRole("button", { name: "Search" }).click();
      await expect(page.locator("h1")).toHaveText("Search Results");
      await page.getByRole("button", { name: "ADD TO CART" }).first().click();
      await page.getByRole("link", { name: "Cart" }).click();

      await expect(page.getByRole("main")).toContainText("Laptop");
    });
  });
});

test.describe("Searching for products as an admin", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: "login successfully",
          user: {
            _id: "123",
            name: "test admin account",
            email: "admin@email.com",
            phone: "81234567",
            address: "Singapore",
            role: 1,
          },
          token: "placeholder-token",
        }),
      });
    });

    await page.goto("http://localhost:3000/");
    await page.getByRole("link", { name: "Login" }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("admin@email.com");
    await page.getByRole("textbox", { name: "Enter Your Email" }).press("Tab");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("admin@email.com");
    await page.getByRole("button", { name: "LOGIN" }).click();
  });

  test("should return correct number of products", async ({ page }) => {
    await page.route("**/api/v1/product/search/book", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            _id: "1",
            name: "Book 1",
            description: "This is Book 1",
            price: 30,
            slug: "book-1",
          },
          {
            _id: "2",
            name: "Book 2",
            description: "This is Book 2",
            price: 40,
            slug: "book-2",
          },
        ]),
      });
    });

    await page.getByRole("searchbox", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: "Search" }).fill("book");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.locator("h1")).toHaveText("Search Results");
    await expect(page.locator("h6")).toContainText("Found 2");
  });

  test("should return nothing when no products are found", async ({ page }) => {
    await page.route("**/api/v1/product/search/nothing", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([]),
      });
    });

    await page.getByRole("searchbox", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: "Search" }).fill("no products");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.locator("h1")).toHaveText("Search Results");
    await expect(page.locator("h6")).toContainText("No Products Found");
  });

  test.describe("should return products", () => {
    test("that allow users to view more details", async ({ page }) => {
      await page.route("**/api/v1/product/search/book", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              _id: "1",
              name: "Book 1",
              description: "This is Book 1",
              price: 30,
              slug: "book-1",
            },
            {
              _id: "2",
              name: "Book 2",
              description: "This is Book 2",
              price: 40,
              slug: "book-2",
            },
          ]),
        });
      });

      await page.route("**/api/v1/product/get-product/book-1", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Single Product Fetched",
            product: {
              _id: "1",
              name: "Book 1",
              description: "This is Book 1",
              price: 30,
              slug: "book-1",
            },
          }),
        });
      });

      await page.getByRole("searchbox", { name: "Search" }).click();
      await page.getByRole("searchbox", { name: "Search" }).fill("book");
      await page.getByRole("button", { name: "Search" }).click();
      await expect(page.locator("h1")).toHaveText("Search Results");
      await page.getByRole("button", { name: "More Details" }).first().click();

      await expect(page.locator("h1")).toContainText("Product Details");
      await expect(page.locator("h6", { hasText: "Name" })).toContainText(
        "Book 1"
      );
    });

    test("that allow users to add them to their cart", async ({ page }) => {
      await page.route("**/api/v1/product/search/laptop", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              _id: "1",
              name: "Laptop",
              description: "This is a laptop",
              price: 1300,
              slug: "laptop",
            },
          ]),
        });
      });

      await page.getByRole("searchbox", { name: "Search" }).click();
      await page.getByRole("searchbox", { name: "Search" }).fill("laptop");
      await page.getByRole("button", { name: "Search" }).click();
      await expect(page.locator("h1")).toHaveText("Search Results");
      await page.getByRole("button", { name: "ADD TO CART" }).first().click();
      await page.getByRole("link", { name: "Cart" }).click();

      await expect(page.getByRole("main")).toContainText("Laptop");
    });
  });
});

test.describe("Searching for products as a regular user", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: "login successfully",
          user: {
            _id: "123",
            name: "test user",
            email: "user@email.com",
            phone: "81234567",
            address: "Singapore",
            role: 0,
          },
          token: "placeholder-token",
        }),
      });
    });

    await page.goto("http://localhost:3000/");
    await page.getByRole("link", { name: "Login" }).click();
    await page.getByRole("textbox", { name: "Enter Your Email" }).click();
    await page
      .getByRole("textbox", { name: "Enter Your Email" })
      .fill("user@gmail.com");
    await page.getByRole("textbox", { name: "Enter Your Email" }).press("Tab");
    await page
      .getByRole("textbox", { name: "Enter Your Password" })
      .fill("user@gmail.com");
    await page.getByRole("button", { name: "LOGIN" }).click();
  });

  test("should return correct number of products", async ({ page }) => {
    await page.route("**/api/v1/product/search/book", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          {
            _id: "1",
            name: "Book 1",
            description: "This is Book 1",
            price: 30,
            slug: "book-1",
          },
          {
            _id: "2",
            name: "Book 2",
            description: "This is Book 2",
            price: 40,
            slug: "book-2",
          },
        ]),
      });
    });

    await page.getByRole("searchbox", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: "Search" }).fill("book");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.locator("h1")).toHaveText("Search Results");
    await expect(page.locator("h6")).toContainText("Found 2");
  });

  test("should return nothing when no products are found", async ({ page }) => {
    await page.route("**/api/v1/product/search/nothing", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([]),
      });
    });

    await page.getByRole("searchbox", { name: "Search" }).click();
    await page.getByRole("searchbox", { name: "Search" }).fill("no products");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.locator("h1")).toHaveText("Search Results");
    await expect(page.locator("h6")).toContainText("No Products Found");
  });

  test.describe("should return products", () => {
    test("that allow users to view more details", async ({ page }) => {
      await page.route("**/api/v1/product/search/book", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              _id: "1",
              name: "Book 1",
              description: "This is Book 1",
              price: 30,
              slug: "book-1",
            },
            {
              _id: "2",
              name: "Book 2",
              description: "This is Book 2",
              price: 40,
              slug: "book-2",
            },
          ]),
        });
      });

      await page.route("**/api/v1/product/get-product/book-1", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            message: "Single Product Fetched",
            product: {
              _id: "1",
              name: "Book 1",
              description: "This is Book 1",
              price: 30,
              slug: "book-1",
            },
          }),
        });
      });

      await page.getByRole("searchbox", { name: "Search" }).click();
      await page.getByRole("searchbox", { name: "Search" }).fill("book");
      await page.getByRole("button", { name: "Search" }).click();
      await expect(page.locator("h1")).toHaveText("Search Results");
      await page.getByRole("button", { name: "More Details" }).first().click();

      await expect(page.locator("h1")).toContainText("Product Details");
      await expect(page.locator("h6", { hasText: "Name" })).toContainText(
        "Book 1"
      );
    });

    test("that allow users to add them to their cart", async ({ page }) => {
      await page.route("**/api/v1/product/search/laptop", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              _id: "1",
              name: "Laptop",
              description: "This is a laptop",
              price: 1300,
              slug: "laptop",
            },
          ]),
        });
      });

      await page.getByRole("searchbox", { name: "Search" }).click();
      await page.getByRole("searchbox", { name: "Search" }).fill("laptop");
      await page.getByRole("button", { name: "Search" }).click();
      await expect(page.locator("h1")).toHaveText("Search Results");
      await page.getByRole("button", { name: "ADD TO CART" }).first().click();
      await page.getByRole("link", { name: "Cart" }).click();

      await expect(page.getByRole("main")).toContainText("Laptop");
    });
  });
});
