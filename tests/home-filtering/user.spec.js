import { test, expect } from '@playwright/test';

test('Filtering Products', async ({ page }) => {
  await page.routeFromHAR('./tests/home-filtering/hars/filtering/api.har', {
    url: 'http://localhost:3000/api/**',
    update: true,
  });

  await page.goto('http://localhost:3000/');
  await expect(page.locator('div > .card-body')).toHaveCount(6);
  await page.getByRole('checkbox', { name: 'Ballin' }).check();
  await expect(page.locator('div > .card-body')).toHaveCount(7);
  await page.getByRole('radio', { name: '$0 to' }).check();
  await expect(page.locator('div > .card-body')).toHaveCount(5);
  await page.getByRole('checkbox', { name: 'Book' }).check();
  await expect(page.locator('div > .card-body')).toHaveCount(7);
  await page.getByRole('checkbox', { name: 'Book' }).uncheck();
  await expect(page.locator('div > .card-body')).toHaveCount(5);
  await page.getByRole('checkbox', { name: 'Ballin' }).uncheck();
  await expect(page.locator('div > .card-body')).toHaveCount(9);
  await page.getByRole('button', { name: 'RESET FILTERS' }).click();
  await expect(page.locator('div > .card-body')).toHaveCount(6);
});