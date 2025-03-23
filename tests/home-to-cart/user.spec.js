import { test, expect } from '@playwright/test';

test('Adding and removing 3 distinct items from the cart', async ({ page }) => {
  await page.routeFromHAR('./tests/home-to-cart/hars/api.har', {
    url: 'http://localhost:3000/api/**',
    // update: true,
  });
  await page.goto('http://localhost:3000/');
  // add 3 items to cart

  const itemCount = () => page.getByRole('navigation').getByRole('listitem').filter({hasText: 'cart'}).getByRole('superscript')

  await expect(itemCount()).toHaveText('0');
  await page.locator('div:nth-child(1) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await expect(itemCount()).toHaveText('1');
  await page.locator('div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await expect(itemCount()).toHaveText('2');
  await page.locator('div:nth-child(3) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await expect(itemCount()).toHaveText('3');
  
  
  await page.getByRole('link', { name: 'Cart' }).click();
  await expect(page.locator('div').getByRole('img')).toHaveCount(3);
  
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await expect(page.locator('div').getByRole('img')).toHaveCount(2);
  await expect(itemCount()).toHaveText('2');
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await expect(itemCount()).toHaveText('1');
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await expect(itemCount()).toHaveText('0');
  await expect(page.locator('div').getByRole('img')).toHaveCount(0);
});

test('Adding and removing non-unique items from the cart', async ({ page }) => {
  await page.routeFromHAR('./tests/home-to-cart/hars/api.har', {
    url: 'http://localhost:3000/api/**',
  });
  await page.goto('http://localhost:3000/');

  const itemCount = () => page.getByRole('navigation').getByRole('listitem').filter({hasText: 'cart'}).getByRole('superscript')

  await page.locator('div:nth-child(1) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await page.locator('div:nth-child(1) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await page.locator('div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await page.locator('div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await expect(itemCount()).toHaveText('4');
  
  
  await page.getByRole('link', { name: 'Cart' }).click();

  await page.getByRole('button', { name: 'Remove' }).first().click();
  await expect(page.locator('div').getByRole('img')).toHaveCount(3);
  
  await page.getByRole('button', { name: 'Remove' }).nth(1).click();
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await expect(page.locator('div').getByRole('img')).toHaveCount(1);
});