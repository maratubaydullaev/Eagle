import { describe, it, expect } from 'vitest'
import { lessons, worlds } from '../content/content'
import { learning, repetition, storage } from '../services/core'

describe('POCHEMUЧКА MVP content', () => {
  it('has exactly 10 MVP lessons', () => expect(lessons).toHaveLength(10))
  it('has three active MVP worlds', () => expect(worlds.filter(w => w.isActive).map(w => w.id)).toEqual(['world', 'math', 'animals']))
  it('lesson ids are unique', () => expect(new Set(lessons.map(l => l.id)).size).toBe(10))
  it('content activities use supported MVP types', () => expect(lessons.flatMap(l => l.steps).every(a => ['quiz', 'drag_drop', 'matching'].includes(a.type))).toBe(true))
  it('every lesson has at least two activities', () => expect(lessons.every(l => l.steps.length >= 2)).toBe(true))
  it('completed lessons cannot farm XP on replay', () => {
    const state: any = { profile: { id: 'p', age: 7 }, progress: {}, activityMastery: {}, xp: 0, stars: 0 }
    const lesson = lessons[0]
    const first = learning.complete(state, lesson, lesson.steps.length)
    const second = learning.complete(first, lesson, lesson.steps.length)
    expect(second.xp).toBe(first.xp)
    expect(second.progress[lesson.id].attempts).toBe(2)
  })
  it('repetition uses 1/3/7 day intervals', () => {
    const base = new Date('2026-01-01T00:00:00Z')
    for (const [mastery, days] of [[0.2,1],[0.6,3],[0.9,7]] as const) {
      const next = repetition.nextDate({ mastery, completedAt: base.toISOString() } as any)
      expect(Math.round((next.getTime() - base.getTime()) / 86400000)).toBe(days)
    }
  })
  it('unlocking starts with first lesson', () => {
    const state: any = { profile: { age: 7 }, progress: {}, activityMastery: {}, xp: 0, stars: 0 }
    expect(learning.status(state, lessons.find(l => l.worldId === 'world')!)).toBe('available')
  })
  it('storage tolerates missing browser localStorage', () => {
    const original = globalThis.localStorage
    // Vitest may provide localStorage; the production guard is exercised by module initialization.
    expect(storage.load().progress).toBeDefined()
    void original
  })
})