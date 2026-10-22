import { test, expect } from '@playwright/test';

test('el total del carrito es el precio por la cantidad', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('product-name').filter({ hasText: 'Thor Hammer' }).click();
  await page.getByTestId('increase-quantity').click();
  await page.getByTestId('add-to-cart').click();
  await page.getByTestId('nav-cart').click();

  await expect(page.getByTestId('product-quantity')).toHaveValue('2');
  await expect(page.getByTestId('cart-total')).toHaveText('$22.28'); // 2 x $11.14
});
