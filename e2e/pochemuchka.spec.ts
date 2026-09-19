import { test, expect } from '@playwright/test'

const state = {
  profile: {
    id: 'e2e-child',
    name: 'Тест',
    age: 6,
    grade: 1,
    avatar: '🐱',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  progress: {},
  activityMastery: {},
  xp: 0,
  stars: 0,
  purchasedGifts: [],
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate((value) => localStorage.setItem('pochemuchka_state_v1', JSON.stringify(value)), state)
  await page.reload()
})

test('mobile learning journey: home → world → lesson → activity → result', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Привет, Тест/ })).toBeVisible()
  await page.locator('.world-card').first().click()
  await expect(page.getByRole('heading', { name: 'Природа', exact: true })).toBeVisible()

  await page.getByRole('button', { name: /Начать →/ }).first().click()
  await expect(page.getByText('ПЕРЕД НАЧАЛОМ')).toBeVisible()
  await page.getByRole('button', { name: /Начать задания/ }).click()

  for (let step = 0; step < 15; step += 1) {
    if (step === 0) {
      await page.getByRole('button', { name: 'Проверить порядок →' }).click()
    } else {
      await page.locator('.answers button').first().click()
    }
    await page.getByRole('button', { name: 'Следующий вопрос →' }).click()
  }

  await expect(page.getByText('УРОК ЗАВЕРШЁН')).toBeVisible()
  await expect(page.getByText(/правильных ответов/)).toBeVisible()
})

test('parent report is informational and has no fake arithmetic gate', async ({ page }) => {
  await page.locator('.bottom-nav button').nth(3).click()
  await page.getByRole('button', { name: /Для родителей/ }).click()
  await expect(page.getByRole('heading', { name: 'Прогресс ребёнка' })).toBeVisible()
  await expect(page.getByText(/нет фиктивного/)).toBeVisible()
  await expect(page.getByText('7 + 5 = ?')).toHaveCount(0)
})

test('social leaderboard route is no longer exposed', async ({ page }) => {
  await page.goto('/#/leaderboard')
  await expect(page.getByText('Рейтинг')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /Привет, Тест/ })).toBeVisible()
})
