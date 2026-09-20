import type { AppState, ChildProfile, Grade, Lesson, LessonProgress } from '../app/types'
import { lessons } from '../content/content'
import { computeLessonOutcome, GIFT_COSTS } from '../../supabase/functions/_shared/rewards'

const KEY = 'pochemuchka_state_v1'
export const gifts = GIFT_COSTS
const emptyState = (): AppState => ({ profile: null, progress: {}, activityMastery: {}, xp: 0, stars: 0, purchasedGifts: [] })

function getStore(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}
function recalc(state: AppState): AppState {
  state.xp = Object.values(state.progress).reduce((n, p) => n + p.xp, 0)
  const earned = Object.values(state.progress).reduce((n, p) => n + p.stars, 0)
  const spent = state.purchasedGifts.reduce((n, id) => n + (gifts[id as keyof typeof gifts] || 0), 0)
  state.stars = Math.max(0, earned - spent)
  return state
}
export const storage = {
  load(): AppState {
    try {
      const raw = getStore()?.getItem(KEY)
      if (!raw) return emptyState()
      const parsed = JSON.parse(raw)
      return { ...emptyState(), ...parsed, activityMastery: parsed.activityMastery || {}, purchasedGifts: Array.isArray(parsed.purchasedGifts) ? parsed.purchasedGifts : [] }
    } catch { return emptyState() }
  },
  save(state: AppState) { getStore()?.setItem(KEY, JSON.stringify(recalc(state))) },
  profile(profile: ChildProfile) { const state = this.load(); state.profile = profile; this.save(state); return state },
  progress(progress: LessonProgress) { const state = this.load(); state.progress[progress.lessonId] = progress; state.lastLessonId = progress.lessonId; this.save(state); return state },
  purchaseGift(giftId: string) {
    const state = this.load()
    if (!(giftId in gifts) || state.purchasedGifts.includes(giftId)) return state
    const cost = gifts[giftId as keyof typeof gifts]
    const earned = Object.values(state.progress).reduce((n, p) => n + p.stars, 0)
    const spent = state.purchasedGifts.reduce((n, id) => n + (gifts[id as keyof typeof gifts] || 0), 0)
    if (earned - spent < cost) return state
    state.purchasedGifts = [...state.purchasedGifts, giftId]
    this.save(state)
    return state
  },
  activityMastery(activityId: string, correct: boolean) {
    const state = this.load()
    const previous = state.activityMastery[activityId] ?? 0
    state.activityMastery[activityId] = Math.max(0, Math.min(1, previous * 0.7 + (correct ? 0.3 : 0)))
    this.save(state)
    return state
  }
}

export const gradeForAge = (age: number): Grade => age <= 6 ? 1 : age <= 8 ? 2 : 3

export const learning = {
  status(state: AppState, lesson: Lesson) {
    const progress = state.progress[lesson.id]
    if (progress?.status === 'completed') {
      const reviewAt = progress.nextReviewAt ? new Date(progress.nextReviewAt) : null
      if (reviewAt && reviewAt > new Date()) return 'completed_locked'
      return 'available'
    }
    if (progress) return progress.status
    const profileGrade = state.profile?.grade
    const age = state.profile?.age || 7
    const available = lessons.filter(x => x.worldId === lesson.worldId && (profileGrade ? x.grade === profileGrade : x.ageMin <= age && x.ageMax >= age)).sort((a, b) => a.orderIndex - b.orderIndex)
    const index = available.findIndex(x => x.id === lesson.id)
    return index === 0 || state.progress[available[index - 1]?.id]?.status === 'completed' ? 'available' : 'locked'
  },
  start(state: AppState, lessonId: string) {
    const old = state.progress[lessonId]
    const progress: LessonProgress = old
      ? { ...old, status: 'in_progress', startedAt: old.startedAt || new Date().toISOString() }
      : { id: crypto.randomUUID(), profileId: state.profile!.id, lessonId, status: 'in_progress', score: 0, mastery: 0, attempts: 0, startedAt: new Date().toISOString(), xp: 0, stars: 0 }
    const next: AppState = {
      ...state,
      progress: { ...state.progress, [lessonId]: progress },
      lastLessonId: lessonId
    }
    storage.save(next)
    return next
  },
  complete(state: AppState, lesson: Lesson, score: number) {
    const total = Math.max(1, lesson.steps.length)
    const old = state.progress[lesson.id]
    const rewardAlreadyGranted = (old?.xp || 0) > 0
    const completedAt = new Date().toISOString()
    const outcome = computeLessonOutcome(total, score, completedAt)
    const progress: LessonProgress = {
      id: old?.id || crypto.randomUUID(),
      profileId: state.profile!.id,
      lessonId: lesson.id,
      status: 'completed',
      score,
      mastery: outcome.accuracy,
      attempts: (old?.attempts || 0) + 1,
      startedAt: old?.startedAt,
      completedAt,
      nextReviewAt: outcome.nextReviewAt,
      xp: rewardAlreadyGranted ? old!.xp : outcome.xp,
      stars: rewardAlreadyGranted ? Math.max(old!.stars, outcome.stars) : outcome.stars
    }
    const next: AppState = {
      ...state,
      progress: { ...state.progress, [lesson.id]: progress },
      activityMastery: { ...state.activityMastery }
    }
    storage.save(next)
    return next
  }
}

declare global { interface Window { Telegram?: { WebApp?: any } } }
const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined
export const telegram = {
  available: !!tg,
  initData: tg?.initData || '',
  firstName: () => tg?.initDataUnsafe?.user?.first_name || '',
  ready: () => { try { tg?.ready(); tg?.expand() } catch {} },
  haptic: (kind: 'success' | 'error' | 'warning') => { try { tg?.HapticFeedback?.notificationOccurred(kind) } catch {} }
}
telegram.ready()

let sound = getStore()?.getItem('pochemuchka_sound') !== 'off'
let audioContext: AudioContext | null = null
function tone(frequency: number, duration = .1) {
  if (!sound || typeof AudioContext === 'undefined') return
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {})
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain()
    oscillator.frequency.value = frequency; oscillator.connect(gain); gain.connect(audioContext.destination)
    gain.gain.setValueAtTime(.001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(.08, audioContext.currentTime + .02)
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration)
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration + .02)
  } catch {
    // Audio is optional. Never let a restricted WebView break gameplay.
    audioContext = null
  }
}
export const audio = {
  unlock() {
    if (!sound || typeof AudioContext === 'undefined') return
    try {
      audioContext ??= new AudioContext()
      if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {})
    } catch { audioContext = null }
  },
  correct() { tone(660); setTimeout(() => tone(880), 70) },
  wrong() { tone(220, .18) },
  win() { tone(523); setTimeout(() => tone(659), 100); setTimeout(() => tone(784, .2), 200) },
  toggle() { sound = !sound; getStore()?.setItem('pochemuchka_sound', sound ? 'on' : 'off') },
  get enabled() { return sound }
}

export const repetition = {
  intervals: [1, 3, 7],
  needsPractice: (progress: LessonProgress) => progress.attempts > 0 && progress.mastery < .7,
  nextDate: (progress: LessonProgress) => {
    const interval = progress.mastery < 1 ? 1 : 7
    const date = new Date(progress.completedAt || Date.now())
    date.setDate(date.getDate() + interval)
    return date
  }
}
export const ageAdaptation = {
  group: (age: number) => `grade-${gradeForAge(age)}`,
  timerSeconds: (age: number) => age <= 7 ? 20 : age <= 9 ? 17 : 15
}
