import { test, expect } from "@playwright/test";

test.describe("Checking the categories dropdown", () => {
  test("should show all available categories", async ({ page }) => {
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

    await page.goto("http://localhost:3000/");

    const categoriesDropdown = page.getByRole("link", { name: "Categories" });
    await categoriesDropdown.click();
    const dropdownMenu = page.locator(".dropdown-menu");
    const categoryItems = await dropdownMenu.locator("li").all();

    expect(categoryItems).toHaveLength(3);
  });

  test("should show only 'All Categories' if there are no categories", async ({
    page,
  }) => {
    await page.route("**/api/v1/category/get-category", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: "All Categories List",
          category: [],
        }),
      });
    });

    await page.goto("http://localhost:3000/");

    const categoriesDropdown = page.getByRole("link", { name: "Categories" });
    await categoriesDropdown.click();
    const dropdownMenu = page.locator(".dropdown-menu");
    const categoryItems = await dropdownMenu.locator("li").all();

    expect(categoryItems).toHaveLength(1);
    expect(await categoryItems[0].textContent()).toBe("All Categories");
  });
});

test.describe("Checking the categories page", () => {
  test("should show all available categories", async ({ page }) => {
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

    await page.goto("http://localhost:3000/categories");

    expect(await page.getByTestId("category-link").all()).toHaveLength(2);
  });

  test("should show empty message if there are no available categories", async ({
    page,
  }) => {
    await page.route("**/api/v1/category/get-category", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: "All Categories List",
          category: [],
        }),
      });
    });

    await page.goto("http://localhost:3000/categories");

    await expect(page.getByText("No categories found")).toBeVisible();
  });
});
