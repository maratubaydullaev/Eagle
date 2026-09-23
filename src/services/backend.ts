import type { AppState, ActivityAttempt, ChildProfile, LessonProgress } from '../app/types'
import { gradeForAge, telegram } from './core'
import { lessons } from '../content/content'
import { activityContentHash, computeWallet, lessonContentHash } from '../../supabase/functions/_shared/rewards'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const configured = () => Boolean(url && telegram.initData)
const endpoint = url ? `${url.replace(/\/$/, '')}/functions/v1/pochemuchka-api` : ''

async function call(action: string, payload: Record<string, unknown> = {}) {
  if (!configured()) return null
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ initData: telegram.initData, action, payload }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) throw new Error(body.error || `backend ${res.status}`)
  return body
}
function fromRow(row: any): LessonProgress {
  return {
    id: row.id,
    profileId: row.profile_id,
    lessonId: row.lesson_id,
    status: row.status,
    score: row.score ?? 0,
    mastery: Number(row.mastery ?? 0),
    attempts: row.attempts ?? 0,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    nextReviewAt: row.next_review_at ?? undefined,
    xp: row.xp ?? 0,
    stars: row.stars ?? 0,
  }
}

function lessonById(lessonId: string) {
  return lessons.find((l) => l.id === lessonId)
}
function activityById(activityId: string) {
  for (const lesson of lessons) {
    const activity = lesson.steps.find((s) => s.id === activityId)
    if (activity) return { lesson, activity }
  }
  return undefined
}
function hashForLesson(lessonId: string): string {
  const lesson = lessonById(lessonId)
  return lesson ? lessonContentHash(lesson.id, lesson.steps) : ''
}
function hashForActivity(activityId: string): string {
  const found = activityById(activityId)
  return found ? activityContentHash(found.activity) : ''
}

export const backend = {
  get enabled() { return configured() },
  async bootstrap(): Promise<AppState | null> {
    const body = await call('bootstrap')
    if (!body) return null
    const profile = body.profile
      ? {
          id: body.profile.id,
          name: body.profile.name,
          age: body.profile.age,
          grade: body.profile.grade || gradeForAge(Number(body.profile.age)),
          avatar: body.profile.avatar || '🐱',
          createdAt: body.profile.created_at,
          updatedAt: body.profile.updated_at,
        } as ChildProfile
      : null
    const progress = Object.fromEntries((body.progress || []).map((r: any) => [r.lesson_id, fromRow(r)]))
    const ps = Object.values(progress) as LessonProgress[]
    const purchasedGifts = (body.giftPurchases || []).map((x: any) => String(x.gift_id || x.giftId)).filter(Boolean)
    const earnedStars = ps.reduce((n, p) => n + p.stars, 0)
    const { balance } = computeWallet(earnedStars, purchasedGifts)
    return {
      profile,
      progress,
      xp: ps.reduce((n, p) => n + p.xp, 0),
      stars: balance,
      purchasedGifts,
      lastLessonId: ps.find((p) => p.status === 'in_progress')?.lessonId,
    }
  },
  async saveProfile(profile: ChildProfile) {
    await call('save_profile', { name: profile.name, age: profile.age, avatar: profile.avatar })
  },
  async purchaseGift(giftId: string): Promise<{ stars: number; purchasedGifts: string[] }> {
    const body = await call('purchase_gift', { giftId })
    if (!body) throw new Error('backend unavailable')
    return { stars: Number(body.stars || 0), purchasedGifts: (body.purchasedGifts || []).map(String) }
  },
  async getDueReviews(): Promise<LessonProgress[]> {
    const body = await call('due_reviews')
    return body ? (body.progress || []).map(fromRow) : []
  },
  async saveProgress(
    progress: LessonProgress,
  ): Promise<{ serverScore?: number; contentDrift: boolean; progress?: LessonProgress } | null> {
    const body = await call('save_progress', {
      lessonId: progress.lessonId,
      status: progress.status,
      startedAt: progress.startedAt,
      contentHash: hashForLesson(progress.lessonId),
    })
    if (!body) return null
    return {
      serverScore: typeof body.serverScore === 'number' ? body.serverScore : undefined,
      contentDrift: Boolean(body.content_drift),
      progress: body.progress ? fromRow(body.progress) : undefined,
    }
  },
  async saveActivityAttempt(
    attempt: Omit<ActivityAttempt, 'id' | 'createdAt'>,
  ): Promise<{ isCorrect: boolean; contentDrift: boolean } | null> {
    const body = await call('activity_attempt', {
      activityId: attempt.activityId,
      answer: attempt.answer,
      timeSpent: attempt.timeSpent,
      contentHash: hashForActivity(attempt.activityId),
    })
    if (!body) return null
    return { isCorrect: Boolean(body.isCorrect), contentDrift: Boolean(body.content_drift) }
  },
  async event(eventName: string, payload: Record<string, unknown> = {}) {
    try {
      await call('analytics', { eventName, payload })
    } catch {
      /* analytics must never block gameplay */
    }
  },
}
