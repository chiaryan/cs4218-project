import { test, expect } from "@playwright/test";

test.describe("Viewing a category", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/category/get-category", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: "All Categories List",
          category: [
            {
              _id: "1",
              name: "Books",
              slug: "books",
            },
            {
              _id: "2",
              name: "Electronics",
              slug: "electronics",
            },
          ],
        }),
      });
    });
  });

  test("should show available products in that category", async ({ page }) => {
    await page.route(
      "**/api/v1/product/product-category/electronics",
      (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            category: { name: "Electronics" },
            products: [
              {
                _id: "1",
                name: "Smartphone",
                slug: "smartphone",
                price: 500,
                description: "Latest smartphone with great features",
              },
              {
                _id: "2",
                name: "Laptop",
                slug: "laptop",
                price: 700,
                description: "High-performance laptop for professionals",
              },
            ],
          }),
        });
      }
    );

    await page.goto("http://localhost:3000/");

    await page.getByRole("link", { name: "Categories" }).click();
    await page
      .getByRole("link", {
        name: "Electronics",
      })
      .click();

    await expect(page.getByText("Category - Electronics")).toBeVisible();
    await expect(page.getByTestId("product-card")).toHaveCount(2);
  });

  test("should show products that can be added to cart", async ({ page }) => {
    await page.route(
      "**/api/v1/product/product-category/electronics",
      (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            category: { name: "Electronics" },
            products: [
              {
                _id: "1",
                name: "Smartphone",
                slug: "smartphone",
                price: 500,
                description: "Latest smartphone with great features",
              },
              {
                _id: "2",
                name: "Laptop",
                slug: "laptop",
                price: 700,
                description: "High-performance laptop for professionals",
              },
            ],
          }),
        });
      }
    );

    await page.goto("http://localhost:3000/");

    await page.getByRole("link", { name: "Categories" }).click();
    await page
      .getByRole("link", {
        name: "Electronics",
      })
      .click();

    await page.getByText("ADD TO CART").first().click();

    const cartItemCount = JSON.parse(
      await page.evaluate(() => localStorage.getItem("cart"))
    ).length;
    expect(cartItemCount).toBe(1);
  });

  test("should show empty message if there are no products in the selected category", async ({
    page,
  }) => {
    await page.route(
      "**/api/v1/product/product-category/electronics",
      (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            category: { name: "Electronics" },
            products: [],
          }),
        });
      }
    );

    await page.goto("http://localhost:3000/");

    await page.getByRole("link", { name: "Categories" }).click();
    await page
      .getByRole("link", {
        name: "Electronics",
      })
      .click();

    await expect(page.getByText("0 result found")).toBeVisible();
  });

  test("should navigate to product details page when 'More Details' is clicked", async ({
    page,
  }) => {
    await page.route(
      "**/api/v1/product/product-category/electronics",
      (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            category: { name: "Electronics" },
            products: [
              {
                _id: "1",
                name: "Smartphone",
                slug: "smartphone",
                price: 500,
                description: "Latest smartphone with great features",
              },
              {
                _id: "2",
                name: "Laptop",
                slug: "laptop",
                price: 700,
                description: "High-performance laptop for professionals",
              },
            ],
          }),
        });
      }
    );

    await page.goto("http://localhost:3000/");

    await page.getByRole("link", { name: "Categories" }).click();
    await page
      .getByRole("link", {
        name: "Electronics",
      })
      .click();

    await page
      .getByTestId("product-card")
      .first()
      .locator("button", {
        hasText: "More Details",
      })
      .click();

    await expect(page).toHaveURL("http://localhost:3000/product/smartphone");
  });
});

test.describe("Viewing a category from the Categories page", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/category/get-category", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: "All Categories List",
          category: [
            {
              _id: "1",
              name: "Books",
              slug: "books",
            },
            {
              _id: "2",
              name: "Electronics",
              slug: "electronics",
            },
          ],
        }),
      });
    });
  });

  test("should show available products in that category", async ({ page }) => {
    await page.route(
      "**/api/v1/product/product-category/electronics",
      (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            category: { name: "Electronics" },
            products: [
              {
                _id: "1",
                name: "Smartphone",
                slug: "smartphone",
                price: 500,
                description: "Latest smartphone with great features",
              },
              {
                _id: "2",
                name: "Laptop",
                slug: "laptop",
                price: 700,
                description: "High-performance laptop for professionals",
              },
            ],
          }),
        });
      }
    );

    await page.goto("http://localhost:3000/categories");

    await expect(page.getByTestId("category-link")).toHaveCount(2);
    await page
      .getByRole("link", {
        name: "Electronics",
      })
      .click();

    await expect(page.getByText("Category - Electronics")).toBeVisible();
    await expect(page.getByTestId("product-card")).toHaveCount(2);
  });

  test("should show products that can be added to cart", async ({ page }) => {
    await page.route(
      "**/api/v1/product/product-category/electronics",
      (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            category: { name: "Electronics" },
            products: [
              {
                _id: "1",
                name: "Smartphone",
                slug: "smartphone",
                price: 500,
                description: "Latest smartphone with great features",
              },
              {
                _id: "2",
                name: "Laptop",
                slug: "laptop",
                price: 700,
                description: "High-performance laptop for professionals",
              },
            ],
          }),
        });
      }
    );

    await page.goto("http://localhost:3000/categories");

    await page
      .getByRole("link", {
        name: "Electronics",
      })
      .click();

    await page.getByText("ADD TO CART").first().click();

    const cartItemCount = JSON.parse(
      await page.evaluate(() => localStorage.getItem("cart"))
    ).length;
    expect(cartItemCount).toBe(1);
  });

  test("should navigate to product details page when 'More Details' is clicked", async ({
    page,
  }) => {
    await page.route(
      "**/api/v1/product/product-category/electronics",
      (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            category: { name: "Electronics" },
            products: [
              {
                _id: "1",
                name: "Smartphone",
                slug: "smartphone",
                price: 500,
                description: "Latest smartphone with great features",
              },
              {
                _id: "2",
                name: "Laptop",
                slug: "laptop",
                price: 700,
                description: "High-performance laptop for professionals",
              },
            ],
          }),
        });
      }
    );

    await page.goto("http://localhost:3000/categories");

    await page
      .getByRole("link", {
        name: "Electronics",
      })
      .click();

    await page
      .getByTestId("product-card")
      .first()
      .locator("button", {
        hasText: "More Details",
      })
      .click();

    await expect(page).toHaveURL("http://localhost:3000/product/smartphone");
  });

  test("should show empty message if there are no products in the selected category", async ({
    page,
  }) => {
    await page.route(
      "**/api/v1/product/product-category/electronics",
      (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            category: { name: "Electronics" },
            products: [],
          }),
        });
      }
    );

    await page.goto("http://localhost:3000/categories");

    await page
      .getByRole("link", {
        name: "Electronics",
      })
      .click();

    await expect(page.getByText("0 result found")).toBeVisible();
  });
});
