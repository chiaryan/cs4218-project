import { test, expect } from "@playwright/test";

test.describe("User auth", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/register");
  });

  test("should fail to login with invalid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    await page.getByPlaceholder("Enter Your Email").fill("cs4218@email.com");
    await page.getByPlaceholder("Enter Your Password").fill("123456");

    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();
    await page.waitForTimeout(500);

    // verify that the user is not logged in
    const user = await page.evaluate(() => localStorage.getItem("auth"));
    expect(user).toBe(null);
  });

  test("should login successfully", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    await page.getByPlaceholder("Enter Your Email").fill("cs4218@test.com");
    await page.getByPlaceholder("Enter Your Password").fill("cs4218@test.com");
    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();

    // wait for the user to be redirected to the homepage
    await page.waitForURL("http://localhost:3000/");

    // verify that the user is logged in
    const user = await page.evaluate(
      () => JSON.parse(localStorage.getItem("auth")).user
    );
    expect(user).toMatchObject({ name: "CS 4218 Test Account", email: "cs4218@test.com" });
  });

  test("should register a new user and login", async ({ page }) => {
    const email = `johndoe${Date.now()}@email.com`;
    await page.getByPlaceholder("Enter Your Name").fill("John Doe");
    await page.getByPlaceholder("Enter Your Email ").fill(email);
    await page.getByPlaceholder("Enter Your Password").fill("123456");
    await page.getByPlaceholder("Enter Your Phone").fill("1234567890");
    await page.getByPlaceholder("Enter Your Address").fill("123 Street");
    await page.getByPlaceholder("Enter Your DOB").fill("2000-01-01");
    await page
      .getByPlaceholder("What is Your Favorite sports")
      .fill("Football");

    // submit the form clicking REGISTER
    await page.getByRole("button").filter({ hasText: "REGISTER" }).click();

    // wait for to be redirected to the login page
    await page.waitForURL("http://localhost:3000/login");

    // login with the registered user
    await page.getByPlaceholder("Enter Your Email").fill(email);
    await page.getByPlaceholder("Enter Your Password").fill("123456");
    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();

    // wait for the user to be redirected to the homepage
    await page.waitForURL("http://localhost:3000/");

    // verify that the user is logged in
    const user = await page.evaluate(
      () => JSON.parse(localStorage.getItem("auth")).user
    );
    expect(user).toMatchObject({ name: "John Doe", email });
  });

  test("should logout successfully", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    await page.getByPlaceholder("Enter Your Email").fill("cs4218@test.com");
    await page.getByPlaceholder("Enter Your Password").fill("cs4218@test.com");
    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();

    // wait for the user to be redirected to the homepage
    await page.waitForURL("http://localhost:3000/");

    // logout the user
    await page.getByText("CS 4218 TEST ACCOUNT").click();
    await page.getByText("LOGOUT").click();

    // verify that the user is logged out
    const user = await page.evaluate(() => localStorage.getItem("auth"));
    expect(user).toBe(null);
  });
});

test.describe("Admin auth", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
  });

  test("should login as admin successfully", async ({ page }) => {
    await page.getByPlaceholder("Enter Your Email").fill("test@admin.com");
    await page.getByPlaceholder("Enter Your Password").fill("test@admin.com");

    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();

    // wait for the user to be redirected to the homepage
    await page.waitForURL("http://localhost:3000/");

    // admin can goto the admin dashboard
    const response = await page.goto("http://localhost:3000/dashboard/admin");

    // verify that the user is logged in as admin
    const user = await page.evaluate(
      () => JSON.parse(localStorage.getItem("auth")).user
    );

    expect(user).toMatchObject({ name: "Test", email: "test@admin.com", role: 1 });
    expect(response.status()).toBe(200);
  })
})

test.describe("User profile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
  });

  test("should update user profile", async ({ page }) => {
    await page.getByPlaceholder("Enter Your Email").fill("cs4218@test.com");
    await page.getByPlaceholder("Enter Your Password").fill("cs4218@test.com");
    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();

    // wait for the user to be redirected to the homepage
    await page.waitForURL("http://localhost:3000/");

    await page.goto("http://localhost:3000/dashboard/user/profile");
    // save old user data
    const oldUser = await page.evaluate(
      () => JSON.parse(localStorage.getItem("auth")).user
    );

    await page.getByPlaceholder("Enter Your Name").fill("John Doe");
    await page.getByPlaceholder("Enter Your Password").fill("123456");
    await page.getByPlaceholder("Enter Your Phone").fill("1234567890");
    await page.getByPlaceholder("Enter Your Address").fill("123 Street");

    await page.getByRole("button").filter({ hasText: "UPDATE" }).click();

    // wait for the success message
    await page.waitForSelector('div[role="status"]');
    const successMessage = await page.getByRole("status").innerText();

    // verify that the user profile is updated by logging out and logging in again
    await page.getByText("JOHN DOE").click();
    await page.getByText("LOGOUT").click();
    await page.goto("http://localhost:3000/login");

    await page.getByPlaceholder("Enter Your Email").fill("cs4218@test.com");
    await page.getByPlaceholder("Enter Your Password").fill("123456");
    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();

    // wait for the user to be redirected to the homepage
    await page.waitForURL("http://localhost:3000/");

    await page.goto("http://localhost:3000/dashboard/user/profile");

    const user = await page.evaluate(
      () => JSON.parse(localStorage.getItem("auth")).user
    );
    expect(user).toMatchObject({
      name: "John Doe",
      email: "cs4218@test.com",
      phone: "1234567890",
      address: "123 Street",
    });
    expect(successMessage).toBe("Profile Updated Successfully");

    // reset
    await page.getByPlaceholder("Enter Your Name").fill(oldUser.name);
    await page.getByPlaceholder("Enter Your Phone").fill(oldUser.phone);
    await page.getByPlaceholder("Enter Your Address").fill(oldUser.address);
    await page.getByPlaceholder("Enter Your Password").fill(oldUser.email);
    await page.getByRole("button").filter({ hasText: "UPDATE" }).click();
  })

  test("should fail if password length is less than 6 characters", async ({page}) => {
    await page.getByPlaceholder("Enter Your Email").fill("test@gmail.com");
    await page.getByPlaceholder("Enter Your Password").fill("test@gmail.com");
    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();

    // wait for the user to be redirected to the homepage
    await page.waitForURL("http://localhost:3000/");

    await page.goto("http://localhost:3000/dashboard/user/profile");
    await page.getByPlaceholder("Enter Your Password").fill("12345");

    await page.getByRole("button").filter({ hasText: "UPDATE" }).click();
    await page.waitForTimeout(500);

    // wait for the error message
    await page.waitForSelector('div[role="status"]');
    const errorMessage = await page.getByRole("status").innerText();

    // logout and login again to ensure that password is not changed
    await page.getByText("TEST@GMAIL.COM").click();
    await page.getByText("LOGOUT").click();

    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Enter Your Email").fill("test@gmail.com");
    await page.getByPlaceholder("Enter Your Password").fill("test@gmail.com");
    await page.getByRole("button").filter({ hasText: "LOGIN" }).click();

    // wait for the user to be redirected to the homepage
    await page.waitForURL("http://localhost:3000/");

    await page.waitForSelector('div[role="status"]');
    const loginMessage = await page.getByRole("status").innerText();

    expect(loginMessage).toBe("login successfully");
    expect(errorMessage).toBe("Something went wrong");

  })
})
