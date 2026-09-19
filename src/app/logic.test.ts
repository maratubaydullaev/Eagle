import { describe, it, expect } from 'vitest'
import { lessons, worlds } from '../content/content'
import { learning, repetition, storage, ageAdaptation, gradeForAge } from '../services/core'

describe('POCHEMUЧКА curriculum', () => {
  it('has 12 curriculum lessons', () => expect(lessons).toHaveLength(12))
  it('has four active curriculum worlds', () => expect(worlds.filter(w => w.isActive).map(w => w.id)).toEqual(['world', 'animals', 'languages', 'math']))
  it('has 200 curriculum activities', () => expect(lessons.flatMap(l => l.steps)).toHaveLength(200))
  it('has 50 questions per topic', () => {
    for (const worldId of ['world', 'animals', 'languages', 'math']) expect(lessons.filter(l => l.worldId === worldId).flatMap(l => l.steps)).toHaveLength(50)
  })
  it('has 15/15/20 questions per grade', () => {
    expect(lessons.filter(l => l.grade === 1).flatMap(l => l.steps)).toHaveLength(60)
    expect(lessons.filter(l => l.grade === 2).flatMap(l => l.steps)).toHaveLength(60)
    expect(lessons.filter(l => l.grade === 3).flatMap(l => l.steps)).toHaveLength(80)
  })
  it('lesson and activity ids are unique', () => {
    const lessonIds = lessons.map(l => l.id)
    const activityIds = lessons.flatMap(l => l.steps).map(a => a.id)
    expect(new Set(lessonIds).size).toBe(12)
    expect(new Set(activityIds).size).toBe(200)
  })
  it('all curriculum activities are supported quizzes', () => expect(lessons.flatMap(l => l.steps).every(a => a.type === 'quiz')).toBe(true))
  it('all quiz activities have three distinct answers and an explanation', () => {
    for (const activity of lessons.flatMap(l => l.steps)) {
      const d = activity.data as any
      expect(d.answers).toHaveLength(3)
      expect(new Set(d.answers.map((x: any) => x.text)).size).toBe(3)
      expect(d.explanation).toBeTruthy()
      expect(d.answers[d.correctAnswerId].text).toBeTruthy()
      expect(['0', '1', '2']).toContain(d.correctAnswerId)
    }
  })
  it('distributes correct answers across all three positions', () => {
    const activities = lessons.flatMap(l => l.steps)
    const counts = ['0', '1', '2'].map(position => activities.filter(a => String((a.data as any).correctAnswerId) === position).length)
    expect(counts).toEqual([66, 67, 67])
  })
  it('locks a lesson with any mistake until the next day', () => {
    const progress = { id: 'p1', profileId: 'child', lessonId: 'test', status: 'completed', score: 1, mastery: 0.5, attempts: 1, completedAt: '2026-09-19T10:00:00Z' } as any
    expect(repetition.nextDate(progress).toISOString()).toBe('2026-09-20T10:00:00.000Z')
  })
  it('allows a perfect lesson to be reviewed later', () => {
    const progress = { id: 'p2', profileId: 'child', lessonId: 'test', status: 'completed', score: 2, mastery: 1, attempts: 1, completedAt: '2026-09-19T10:00:00Z' } as any
    expect(repetition.nextDate(progress).toISOString()).toBe('2026-09-26T10:00:00.000Z')
  })
  it('maps school ages to grades', () => {
    expect(gradeForAge(4)).toBe(1)
    expect(gradeForAge(5)).toBe(1)
    expect(gradeForAge(6)).toBe(1)
    expect(gradeForAge(7)).toBe(2)
    expect(gradeForAge(8)).toBe(2)
    expect(gradeForAge(9)).toBe(3)
    expect(gradeForAge(10)).toBe(3)
  })
  it('age adaptation uses agreed quiz timers', () => {
    expect(ageAdaptation.timerSeconds(6)).toBe(20)
    expect(ageAdaptation.timerSeconds(8)).toBe(17)
    expect(ageAdaptation.timerSeconds(10)).toBe(15)
  })
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
  it('unlocking starts with the first lesson of a world', () => {
    const state: any = { profile: { age: 7, grade: 2 }, progress: {}, activityMastery: {}, xp: 0, stars: 0 }
    expect(learning.status(state, lessons.find(l => l.worldId === 'world' && l.grade === 2)!)).toBe('available')
  })
  it('storage tolerates missing browser localStorage', () => {
    expect(storage.load().progress).toBeDefined()
  })
})