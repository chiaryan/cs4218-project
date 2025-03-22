import { test, expect } from '@playwright/test';

/**
 * The test case below tests the CRUD operations for products as an admin.
 * The test uses the live DB with mock data provided and the test user is an admin, with the admin user credentials
 * having been created in the DB.
 * For the admin user in this test suite, the email is test1@gmail.com and the password is 111111 which is logged in before
 * each test.
 * All tests would return the live DB to the state it was before the test suite was run.
 * The test suite first logs in as the admin user, then navigates to the create product page.
 * The test suite then creates a new product, updates the product and deletes the product
 * with verification.
 * The test suite also tests for edge cases where the any of the required fields are not provided and where the product is empty.
 */

test.describe('Testing product CRUD operations as admin', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page and log in as admin
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Enter Your Email' }).click();
    await page
      .getByRole('textbox', { name: 'Enter Your Email' })
      .fill('test1@gmail.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).click();
    await page
      .getByRole('textbox', { name: 'Enter Your Password' })
      .fill('111111');
    await page.getByRole('button', { name: 'LOGIN' }).click();
    await page.getByRole('button', { name: 'test' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();
  });

  test('should successfuly create, update and delete product', async ({
    page,
  }) => {
    // Create new product with all fields
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.locator('#rc_select_0').click();
    await page
      .getByTestId('category-option-66db427fdb0119d9234b27ed')
      .getByText('Electronics')
      .click();
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page
      .getByRole('textbox', { name: 'write a name' })
      .fill('Harry Potter');
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page
      .getByRole('textbox', { name: 'write a description' })
      .fill('Book about Harry Potter');
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill('20');
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill('5');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();

    // Check if the product is created
    await expect(
      page.getByRole('heading', { name: 'All Products List' })
    ).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Harry Potter');
    await page
      .getByRole('link', { name: 'Harry Potter Harry Potter' })
      .first()
      .click();
    await expect(page.getByPlaceholder('write a description')).toContainText(
      'Book about Harry Potter'
    );
    await expect(page.getByRole('main')).toContainText('Electronics');

    // Update the product
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page
      .getByRole('textbox', { name: 'write a name' })
      .fill('Harry Potter Updated');
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page
      .getByRole('textbox', { name: 'write a description' })
      .fill('Updated description of Book about Harry Potter');
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill('50');
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill('10');
    await page.getByRole('main').getByText('Electronics').click();
    await page.getByTitle('Book').locator('div').click();
    await page.getByRole('button', { name: 'UPDATE PRODUCT' }).click();

    // Check if the product is updated
    await expect(
      page.getByRole('heading', { name: 'All Products List' })
    ).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Harry Potter Updated');
    await page
      .getByRole('link', { name: 'Harry Potter Updated Harry' })
      .click();
    await expect(page.getByPlaceholder('write a description')).toContainText(
      'Updated description of Book about Harry Potter'
    );
    await expect(page.getByRole('main')).toContainText('Book');

    // Delete the product
    page.once('dialog', async (dialog) => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept('Accept');
    });
    await page.getByRole('button', { name: 'DELETE PRODUCT' }).click();

    // Check if the product is deleted
    await expect(
      page.getByRole('heading', { name: 'All Products List' })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Harry Potter Updated' })
    ).not.toBeVisible();
  });

  test('should not create product if required fields are missing', async ({
    page,
  }) => {
    // Create new product
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in creating product'
    );
  });

  test('should not create product if the category is empty', async ({
    page,
  }) => {
    // Create new product without category
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page
      .getByRole('textbox', { name: 'write a name' })
      .fill('Harry Potter');
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page
      .getByRole('textbox', { name: 'write a description' })
      .fill('Book about Harry Potter');
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill('20');
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill('5');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in creating product'
    );
  });

  test('should not create product if the name is missing', async ({ page }) => {
    // Create new product without name
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.locator('#rc_select_0').click();
    await page
      .getByTestId('category-option-66db427fdb0119d9234b27ed')
      .getByText('Electronics')
      .click();
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page
      .getByRole('textbox', { name: 'write a description' })
      .fill('Book about Harry Potter');
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill('20');
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill('5');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in creating product'
    );
  });

  test('should not create product if the description is missing', async ({
    page,
  }) => {
    // Create new product without description
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.locator('#rc_select_0').click();
    await page
      .getByTestId('category-option-66db427fdb0119d9234b27ed')
      .getByText('Electronics')
      .click();
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page
      .getByRole('textbox', { name: 'write a name' })
      .fill('Harry Potter');
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill('20');
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill('5');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in creating product'
    );
  });

  test('should not create product if the price is missing', async ({
    page,
  }) => {
    // Create new product without price
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.locator('#rc_select_0').click();
    await page
      .getByTestId('category-option-66db427fdb0119d9234b27ed')
      .getByText('Electronics')
      .click();
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page
      .getByRole('textbox', { name: 'write a name' })
      .fill('Harry Potter');
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page
      .getByRole('textbox', { name: 'write a description' })
      .fill('Book about Harry Potter');
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill('5');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in creating product'
    );
  });

  test('should not create product if the quantity is missing', async ({
    page,
  }) => {
    // Create new product without quantity
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.locator('#rc_select_0').click();
    await page
      .getByTestId('category-option-66db427fdb0119d9234b27ed')
      .getByText('Electronics')
      .click();
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page
      .getByRole('textbox', { name: 'write a name' })
      .fill('Harry Potter');
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page
      .getByRole('textbox', { name: 'write a description' })
      .fill('Book about Harry Potter');
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill('20');
    await page.locator('#rc_select_1').click();
    await page.getByText('Yes').click();
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in creating product'
    );
  });

  test('should not create product if the shipping is missing', async ({
    page,
  }) => {
    // Create new product without shipping
    await page.getByRole('link', { name: 'Create Product' }).click();
    await page.locator('#rc_select_0').click();
    await page
      .getByTestId('category-option-66db427fdb0119d9234b27ed')
      .getByText('Electronics')
      .click();
    await page.getByRole('textbox', { name: 'write a name' }).click();
    await page
      .getByRole('textbox', { name: 'write a name' })
      .fill('Harry Potter');
    await page.getByRole('textbox', { name: 'write a description' }).click();
    await page
      .getByRole('textbox', { name: 'write a description' })
      .fill('Book about Harry Potter');
    await page.getByPlaceholder('write a Price').click();
    await page.getByPlaceholder('write a Price').fill('20');
    await page.getByPlaceholder('write a quantity').click();
    await page.getByPlaceholder('write a quantity').fill('5');
    await page.getByRole('button', { name: 'CREATE PRODUCT' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in creating product'
    );
  });
});
