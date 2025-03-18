//done by austin
//IMPORTANT: please run npm start in client folder and have the frontend running, DO NOT HAVE AN ACTIVE BACKEND
//also do run npx playwright install
//ai declaration: AI assistance was used to help write this file, however all prompts made by me.

import { test, expect } from '@playwright/test';

test.describe('UI end to end test for orders page', () => {
  test.beforeEach(async ({page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'auth',
        JSON.stringify({user: { id: 69, name: 'mrcs4218' },token: 'testing' })
      );
    });

    await page.route('**/api/v1/auth/user-auth',async (route) => {
      await route.fulfill({
        status: 200,
        body:JSON.stringify({ok: true }),
        contentType: 'application/json',
      });
    });

    await page.route('**/api/v1/auth/orders',async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: '126',
            status: 'Delivered',
            buyer: { name:'MdmCs4218' },
            products: [{
                _id: '123',
                name: 'banana pancake',
                description: 'tasty pancakes',
                price: 999
              }],
            createAt:"13th Jan 2022",
            payment: { success: true }
          }
        ]),
      });
    });
  });

  test('orders page has correct contents', async ({page }) => {
    await page.goto('http://localhost:3000/dashboard/user/orders');
    await expect(page).toHaveURL(new RegExp('dashboard/user/orders'));

    await expect(page).toHaveTitle('Your Orders');

    const getpage = page.locator('.list-group');
    const contentsexpected = ['Orders', 'Dashboard', 'Profile'];
    for (let item of contentsexpected) {
      await expect(getpage.getByText(item)).toBeVisible();
    }

  });

  test('orders page has all orders', async ({page }) => {
    await page.goto('http://localhost:3000/dashboard/user/orders');

    await expect(page).toHaveURL(new RegExp('dashboard/user/orders'));
    await expect(page).toHaveTitle('Your Orders');
    await expect(page.locator('text=All Orders')).toBeVisible();
  });
});

