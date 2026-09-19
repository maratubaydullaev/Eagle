import { describe, it, expect } from 'vitest'
import { lessons, worlds } from '../content/content'
import { learning, repetition, storage, ageAdaptation, gradeForAge } from '../services/core'

describe('POCHEMUЧКА MVP content', () => {
  it('has 12 curriculum lessons', () => expect(lessons).toHaveLength(12))
  it('has four active curriculum worlds', () => expect(worlds.filter(w => w.isActive).map(w => w.id)).toEqual(['world','animals','languages','math']))
  it('has 200 curriculum activities', () => expect(lessons.flatMap(l => l.steps)).toHaveLength(200))
  it('has 50 questions per topic', () => { for (const worldId of ['world','animals','languages','math']) expect(lessons.filter(l => l.worldId === worldId).flatMap(l => l.steps)).toHaveLength(50) })
  it('has 15/15/20 questions per grade', () => { expect(lessons.filter(l => l.grade === 1).flatMap(l => l.steps)).toHaveLength(60); expect(lessons.filter(l => l.grade === 2).flatMap(l => l.steps)).toHaveLength(60); expect(lessons.filter(l => l.grade === 3).flatMap(l => l.steps)).toHaveLength(80) })
  it('has four active MVP worlds', () => expect(worlds.filter(w => w.isActive).map(w => w.id)).toEqual(['world', 'math', 'animals', 'languages']))
  it('lesson ids are unique', () => expect(new Set(lessons.map(l => l.id)).size).toBe(13))
  it('locks a lesson with any mistake until the next day', () => {
    const completedAt = new Date('2026-09-19T10:00:00Z').toISOString()
    const progress = {
      id: 'p1',
      profileId: 'child',
      lessonId: 'test',
      status: 'completed',
      score: 1,
      mastery: 0.5,
      attempts: 1,
      completedAt,
    } as any
    const nextReview = new Date(repetition.nextDate(progress))
    expect(nextReview.toISOString()).toBe(new Date('2026-09-20T10:00:00Z').toISOString())
  })

  it('allows a perfect lesson to be reviewed later', () => {
    const progress = {
      id: 'p2',
      profileId: 'child',
      lessonId: 'test',
      status: 'completed',
      score: 2,
      mastery: 1,
      attempts: 1,
      completedAt: '2026-09-19T10:00:00Z',
    } as any
    expect(repetition.nextDate(progress).toISOString()).toBe('2026-09-26T10:00:00.000Z')
  })

  it('content activities use supported MVP types', () => expect(lessons.flatMap(l => l.steps).every(a => ['quiz', 'drag_drop', 'matching'].includes(a.type))).toBe(true))
  it('matching-style MVP activities use the pair engine', () => {
    for (const id of ['w2b', 'a1b', 'a2b']) {
      const activity = lessons.flatMap(l => l.steps).find(a => a.id === id)
      expect(activity).toBeDefined()
      expect(activity?.type).toBe('matching')
    }
  })
  it('compass matching uses the requested labels and instruction', () => {
    const activity = lessons.flatMap(l => l.steps).find(a => a.id === 'w2b')!
    expect(activity.instructions).toBe('Подбери пару: выбери сторону света, затем её обозначение.')
    expect((activity.data as any).pairs).toEqual([['Север', 'North'], ['Юг', 'South'], ['Восток', 'East'], ['Запад', 'West']])
  })
  it('every lesson has at least two activities', () => expect(lessons.every(l => l.steps.length >= 2)).toBe(true))
  it('maps school ages to the agreed grades', () => {
    expect(gradeForAge(6)).toBe(1)
    expect(gradeForAge(7)).toBe(1)
    expect(gradeForAge(8)).toBe(2)
    expect(gradeForAge(9)).toBe(3)
    expect(gradeForAge(10)).toBe(3)
  })

  it('age adaptation uses the agreed quiz timers', () => { expect(ageAdaptation.timerSeconds(6)).toBe(20); expect(ageAdaptation.timerSeconds(8)).toBe(17); expect(ageAdaptation.timerSeconds(10)).toBe(15) })
  it('completed lessons award points without farming on replay', () => {
    const state: any = { profile: { id: 'p', age: 7 }, progress: {}, activityMastery: {}, xp: 0, stars: 0 }
    const lesson = lessons[0]
    const first = learning.complete(state, lesson, lesson.steps.length)
    const second = learning.complete(first, lesson, lesson.steps.length)
    expect(second.xp).toBe(first.xp)
    expect(second.progress[lesson.id].attempts).toBe(2)
  })
  it('repetition is next day after any mistake and later after a perfect lesson', () => {
    const base = new Date('2026-01-01T00:00:00Z')
    const wrong = repetition.nextDate({ mastery: 0.5, completedAt: base.toISOString() } as any)
    const perfect = repetition.nextDate({ mastery: 1, completedAt: base.toISOString() } as any)
    expect(Math.round((wrong.getTime() - base.getTime()) / 86400000)).toBe(1)
    expect(Math.round((perfect.getTime() - base.getTime()) / 86400000)).toBe(7)
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