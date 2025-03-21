import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.locator('.card-name-price > button:nth-child(2)').first().click();
  await page.locator('div:nth-child(2) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await page.locator('div:nth-child(3) > .card-body > div:nth-child(3) > button:nth-child(2)').click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.locator('div').filter({ hasText: /^bosdfbadsfasdPrice : 1Remove$/ }).getByRole('button').click();
  await page.locator('div').filter({ hasText: /^booooookasdasdasdaPrice : 12Remove$/ }).getByRole('button').click();
  await page.getByRole('button', { name: 'Remove' }).click();
  await page.getByRole('link', { name: '🛒 Virtual Vault' }).click();
});