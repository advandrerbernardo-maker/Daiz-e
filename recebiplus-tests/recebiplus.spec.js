import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const app = pathToFileURL(path.resolve('..', 'recebiplus-prototipo.html')).href;
test.beforeEach(async ({ page }) => { await page.goto(app); });
test('seletor oferece de 1 a 20 parcelas', async ({ page }) => { await expect(page.locator('#count option')).toHaveCount(20); });
test('datas permanecem após aumentar parcelas', async ({ page }) => { await page.locator('#count').selectOption('3'); await page.locator('#due-2').fill('2027-01-02'); await page.locator('#count').selectOption('4'); await expect(page.locator('#due-2')).toHaveValue('2027-01-02'); });
test('cadastro de cliente', async ({ page }) => { await page.locator('#customerName').fill('Cliente Exemplo'); await page.locator('#customerPhone').fill('92999999999'); await page.locator('#customerForm button').click(); await expect(page.locator('#customerSelect option')).toHaveCount(2); });
