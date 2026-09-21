// Единственный источник истины для расчёта наград и оценки ответов.
// Используется ОБЕИМИ сторонами:
//   - клиент: src/services/core.ts, src/services/backend.ts, src/screens/Lesson.tsx
//   - Deno:   supabase/functions/pochemuchka-api/index.ts
// Не дублируйте эти формулы ни на одной из сторон.

export const GIFT_COSTS = { sticker: 5, avatar: 10, treasure: 15 } as const
export type GiftId = keyof typeof GIFT_COSTS

export interface LessonOutcome {
  accuracy: number
  stars: number
  xp: number
  nextReviewAt: string
}

export function nextReviewDate(accuracy: number, completedAtIso?: string): string {
  const base = completedAtIso ? new Date(completedAtIso) : new Date()
  base.setDate(base.getDate() + (accuracy < 1 ? 1 : 7))
  return base.toISOString()
}

export function computeLessonOutcome(
  total: number,
  score: number,
  completedAtIso?: string,
): LessonOutcome {
  const safeTotal = Math.max(1, total)
  const safeScore = Math.max(0, Math.min(safeTotal, Math.floor(score)))
  const accuracy = Number((safeScore / safeTotal).toFixed(3))
  const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.6 ? 2 : accuracy >= 0.3 ? 1 : 0
  const xp = 20 + safeScore * 10
  return { accuracy, stars, xp, nextReviewAt: nextReviewDate(accuracy, completedAtIso) }
}

export function computeWallet(
  earnedStars: number,
  purchasedGiftIds: readonly string[],
): { earned: number; spent: number; balance: number } {
  const costs = GIFT_COSTS as Record<string, number>
  const spent = purchasedGiftIds.reduce((n, id) => n + (costs[id] || 0), 0)
  const balance = Math.max(0, earnedStars - spent)
  return { earned: earnedStars, spent, balance }
}

export function evaluateActivity(type: string, content: unknown, answer: unknown): boolean {
  if (!content || answer === null || answer === undefined) return false

  if (type === 'quiz') {
    return typeof answer === 'string' &&
      answer === String((content as { correctAnswerId?: unknown }).correctAnswerId)
  }

  if (type === 'drag_drop') {
    if (!answer || typeof answer !== 'object') return false
    const a = answer as { item?: unknown; target?: unknown }
    const c = content as { targets?: unknown[]; correct?: unknown[] }
    const targetIndex = Array.isArray(c.targets) ? c.targets.indexOf(a.target) : -1
    return targetIndex >= 0 &&
      Array.isArray(c.correct) &&
      String(c.correct[targetIndex]) === String(a.item)
  }

  if (type === 'matching') {
    if (!answer || typeof answer !== 'object') return false
    const a = answer as { first?: unknown; second?: unknown }
    if (typeof a.first !== 'string' || typeof a.second !== 'string') return false
    const c = content as { pairs?: unknown[] }
    return Array.isArray(c.pairs) && c.pairs.some((pair: unknown) =>
      Array.isArray(pair) && pair.length === 2 &&
      ((String(pair[0]) === a.first && String(pair[1]) === a.second) ||
       (String(pair[0]) === a.second && String(pair[1]) === a.first)),
    )
  }

  if (type === 'sorting' || type === 'sequence') {
    const c = content as { correctOrder?: unknown[] }
    if (!Array.isArray(answer) || !Array.isArray(c.correctOrder)) return false
    return answer.length === c.correctOrder.length &&
      answer.every((value: unknown, index: number) =>
        String(value) === String(c.correctOrder![index]))
  }

  return false
}

// --- Детект дрейфа контента ------------------------------------------
// FNV-1a 64-bit по каноничному, отсортированному по ключам JSON.
// Это НЕ security-хэш — только детект расхождения content.ts <-> БД.

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']'
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
}

function fnv1a64(input: string): string {
  let hash = 0xcbf29ce484222325n
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i))
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return hash.toString(16).padStart(16, '0')
}

export interface ContentStep {
  id: string
  type: string
  data: unknown
}

export function activityContentHash(activity: ContentStep): string {
  return fnv1a64(stableStringify({ id: activity.id, type: activity.type, data: activity.data }))
}

export function lessonContentHash(lessonId: string, steps: ContentStep[]): string {
  return fnv1a64(stableStringify({
    id: lessonId,
    steps: steps.map((s) => ({ id: s.id, type: s.type, data: s.data })),
  }))
}
