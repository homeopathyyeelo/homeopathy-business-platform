import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Set fake auth cookie for middleware
  await context.addCookies([
    { name: 'auth-token', value: 'dev.dev.dev', domain: 'localhost', path: '/' },
  ])
})

test('dashboard loads and shows quick modules', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/.*dashboard/)
  await expect(page.getByText('Analytics Dashboard')).toBeVisible()
  await expect(page.getByText('Quick Modules')).toBeVisible()
})

test('retail POS loads', async ({ page }) => {
  await page.goto('/pos')
  await expect(page.getByText('POS System')).toBeVisible()
})

test('wholesale POS loads', async ({ page }) => {
  await page.goto('/pos/wholesale')
  await expect(page.getByText('Wholesale POS')).toBeVisible()
})

test('marketing page loads', async ({ page }) => {
  await page.goto('/marketing')
  await expect(page.getByText('Marketing Automation')).toBeVisible()
})


