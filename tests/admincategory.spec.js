import { test, expect } from '@playwright/test';

/**
 * The test case below tests the CRUD operations for categories as an admin.
 * The test uses the live DB with mock data provided and the test user is an admin, with the admin user credentials
 * having been created in the DB.
 * For the admin user in this test suite, the email is test1@gmail.com and the password is 111111 which is logged in before
 * each test.
 * In the categories mock data, there are 3 categories already created in the DB, including Electronics, Book, and Clothing.
 * All tests would return the live DB to the state it was before the test suite was run.
 * The test suite first logs in as the admin user, then navigates to the category management page.
 * The test suite then creates a new category, updates the category, and deletes the category.
 * The test suite also tests for edge cases where the category name is not provided and where the category already exists
 * when creating or updating the category.
 */

test.describe('Testing categories CRUD operations as admin', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the home page and log in as admin before navigating to the category management page
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

    await page.getByRole('link', { name: 'Create Category' }).click();
    await expect(
      page.getByRole('heading', { name: 'Manage Category' })
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Name' })
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: 'Actions' })
    ).toBeVisible();
  });
  test('should successfully create, update and delete category', async ({
    page,
  }) => {
    // Create new category
    await page.getByRole('textbox', { name: 'Enter new category' }).click();
    await page
      .getByRole('textbox', { name: 'Enter new category' })
      .fill('New testing category');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('main')).toContainText(
      'New testing category is created'
    );
    await expect(
      page.getByRole('cell', { name: 'New testing category', exact: true })
    ).toBeVisible();

    // Update the category
    await page.getByRole('button', { name: 'Edit' }).nth(3).click();
    await page
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Enter new category' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Enter new category' })
      .fill('Edited testing category');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Submit' })
      .click();
    await expect(page.getByRole('main')).toContainText(
      'Edited testing category is updated'
    );
    await expect(
      page.getByRole('cell', { name: 'Edited testing category', exact: true })
    ).toBeVisible();

    // Delete the category
    await page.getByRole('button', { name: 'Delete' }).nth(3).click();
    await expect(page.getByRole('main')).toContainText('category is deleted');
    await expect(
      page.getByRole('cell', { name: 'Edit testing category' })
    ).not.toBeVisible();
  });

  test('should not create category without name', async ({ page }) => {
    // Create new category without name
    await page.getByRole('textbox', { name: 'Enter new category' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in input form'
    );
  });

  test('should not create category that already exists', async ({ page }) => {
    // Create new category
    await page.getByRole('textbox', { name: 'Enter new category' }).click();
    await page
      .getByRole('textbox', { name: 'Enter new category' })
      .fill('New testing category');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('main')).toContainText(
      'New testing category is created'
    );
    await expect(
      page.getByRole('cell', { name: 'New testing category', exact: true })
    ).toBeVisible();

    // Create new category that already exists
    await page.getByRole('textbox', { name: 'Enter new category' }).click();
    await page
      .getByRole('textbox', { name: 'Enter new category' })
      .fill('New testing category');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Category Already Exists'
    );

    // Delete the category to reset the state
    await page.getByRole('button', { name: 'Delete' }).nth(3).click();
    await expect(page.getByRole('main')).toContainText('category is deleted');
    await expect(
      page.getByRole('cell', { name: 'New testing category' })
    ).not.toBeVisible();
  });

  test('should not update category if name already exists', async ({
    page,
  }) => {
    // Create new category
    await page.getByRole('textbox', { name: 'Enter new category' }).click();
    await page
      .getByRole('textbox', { name: 'Enter new category' })
      .fill('New testing category');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('main')).toContainText(
      'New testing category is created'
    );
    await expect(
      page.getByRole('cell', { name: 'New testing category', exact: true })
    ).toBeVisible();

    // Create another new category
    await page.getByRole('textbox', { name: 'Enter new category' }).click();
    await page
      .getByRole('textbox', { name: 'Enter new category' })
      .fill('Another testing category');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('main')).toContainText(
      'Another testing category is created'
    );
    await expect(
      page.getByRole('cell', { name: 'Another testing category', exact: true })
    ).toBeVisible();

    // Update the category with name that already exists
    await page.getByRole('button', { name: 'Edit' }).nth(4).click();
    await page
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Enter new category' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Enter new category' })
      .fill('New testing category');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Submit' })
      .click();
    await expect(page.getByRole('main')).toContainText(
      'Something went wrong in updating category'
    );

    // Delete the categories to reset the state
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: 'Delete' }).nth(4).click();
    await expect(page.getByRole('main')).toContainText('category is deleted');
    await expect(
      page.getByRole('cell', { name: 'Another testing category' })
    ).not.toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).nth(3).click();
    await expect(page.getByRole('main')).toContainText('category is deleted');
    await expect(
      page.getByRole('cell', { name: 'New testing category' })
    ).not.toBeVisible();
  });
});
