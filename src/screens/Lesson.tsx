import { useEffect, useRef, useState } from 'react'
import type { AppState, Lesson as LessonType } from '../app/types'
import { storage, learning, ageAdaptation, gradeForAge } from '../services/core'
import { backend } from '../services/backend'
import { outbox } from '../services/outbox'
import { lessons } from '../content/content'
import { Mascot } from '../components/Mascot'
import { QuizActivity, DragDropActivity, MatchingActivity, SortingActivity } from '../features/activities'
import { computeLessonOutcome } from '../../supabase/functions/_shared/rewards'

interface LessonResult {
  score: number
  total: number
  state: AppState
}

export function Lesson({ s, lesson, done, back, sync }: {
  s: AppState
  lesson: LessonType
  done: (s: AppState) => void
  back: () => void
  sync: (s: AppState) => void
}) {
  const [started] = useState(() => learning.start(s, lesson.id))
  const [brief, setBrief] = useState(true)
  const [step, setStep] = useState(0)
  const [completedResult, setCompletedResult] = useState<LessonResult | null>(null)
  const pendingAttempts = useRef<Promise<unknown>[]>([])
  const [score, setScore] = useState(0)
  const resultDone = useRef(false)

  useEffect(() => { sync(started) }, [started, sync])

  const act = lesson.steps[step]
  const timerSeconds = ageAdaptation.timerSeconds(s.profile!.age)

  useEffect(() => {
    void backend.saveProgress(started.progress[lesson.id]).catch(() => {
      outbox.enqueue({ kind: 'progress', progress: started.progress[lesson.id] })
    })
    void backend.event('lesson_started', { lessonId: lesson.id })
  }, [started, lesson.id])

  async function result(ok: boolean) {
    // StrictMode/двойной клик: итоговый расчёт выполняем ровно один раз.
    if (resultDone.current) return
    const ns = score + (ok ? 1 : 0)
    setScore(ns)
    if (step < lesson.steps.length - 1) {
      setStep(x => x + 1)
      return
    }
    resultDone.current = true

    await Promise.allSettled(pendingAttempts.current).catch(() => {})

    const current = storage.load()
    let next: AppState
    try {
      next = learning.complete(current, lesson, ns)
    } catch {
      next = storage.load()
      const fallback = current.progress[lesson.id]
      if (fallback) {
        next.progress[lesson.id] = {
          ...fallback,
          status: 'completed',
          score: ns,
          mastery: computeLessonOutcome(lesson.steps.length, ns).accuracy,
          attempts: (fallback.attempts || 0) + 1,
          completedAt: new Date().toISOString(),
        }
        storage.save(next)
      }
    }
    sync(next)
    setCompletedResult({ score: ns, total: lesson.steps.length, state: next })

    void (async () => {
      const server = await backend.saveProgress(next.progress[lesson.id]).catch(() => null)
      if (server?.contentDrift) void backend.event('content_drift', { lessonId: lesson.id })
      if (server?.progress) {
        const reconciled = storage.load()
        reconciled.progress[lesson.id] = server.progress
        storage.save(reconciled)
        sync(reconciled)
        setCompletedResult({ score: server.progress.score, total: lesson.steps.length, state: reconciled })
      } else if (!server) {
        outbox.enqueue({ kind: 'progress', progress: next.progress[lesson.id] })
      }
    })()

    void backend.event('lesson_completed', {
      lessonId: lesson.id,
      score: ns,
      total: lesson.steps.length,
      mastery: next.progress[lesson.id]?.mastery ?? 0,
    })
  }

  function onAttempt(ok: boolean, answer: unknown, timeSpent?: number) {
    try {
      const request = backend.saveActivityAttempt({ profileId: s.profile!.id, activityId: act.id, isCorrect: ok, answer, timeSpent }).catch(() => {
        outbox.enqueue({ kind: 'attempt', attempt: { profileId: s.profile!.id, activityId: act.id, isCorrect: ok, answer, timeSpent } })
      })
      pendingAttempts.current.push(request)
    } catch {
      outbox.enqueue({ kind: 'attempt', attempt: { profileId: s.profile!.id, activityId: act.id, isCorrect: ok, answer, timeSpent } })
    }
  }

  if (brief) {
    return (
      <section>
        <button className="back" onClick={back}>← Назад</button>
        <div className="lesson-brief card">
          <span className="lesson-brief-icon">💡</span>
          <p className="eyebrow">ПЕРЕД НАЧАЛОМ</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
          <div className="lesson-goal"><b>🎯 Цель урока</b><span>{lesson.learningGoal[0]}</span></div>
          <div className="lesson-plan"><b>Как будем учиться</b><span>1. Познакомимся с вопросами</span><span>2. Подумай и выбери ответ</span><span>3. Получи объяснение и награду</span></div>
          <button className="primary" type="button" onClick={() => setBrief(false)}>Начать задания →</button>
        </div>
      </section>
    )
  }

  if (completedResult) {
    const resultState = completedResult.state
    const grade = resultState.profile!.grade || gradeForAge(resultState.profile!.age)
    const nextLesson =
      lessons.filter(l => l.grade === grade).sort((a, b) => a.orderIndex - b.orderIndex).find(l => l.worldId === lesson.worldId && l.id !== lesson.id && resultState.progress[l.id]?.status !== 'completed') ||
      lessons.filter(l => l.grade === grade).sort((a, b) => a.orderIndex - b.orderIndex).find(l => l.id !== lesson.id && resultState.progress[l.id]?.status !== 'completed')
    const perfect = completedResult.score === completedResult.total
    const resultTitle = perfect ? 'Идеально! 🌟' : completedResult.score >= Math.ceil(completedResult.total * .7) ? 'Отличная работа! 🎉' : 'Ты справился! 💪'

    return (
      <section className="lesson-result-screen">
        <div className="card lesson-result">
          <div className="result-celebration"><span>✦</span><div className="result-mascot"><Mascot mood="happy" /></div><span>✦</span></div>
          <p className="eyebrow">УРОК ЗАВЕРШЁН</p>
          <h1>{resultTitle}</h1>
          <p className="result-lesson-title">{lesson.title}</p>
          <div className="result-score">
            <div className="result-main-score"><b>{completedResult.score}/{completedResult.total}</b><small>правильных ответов</small></div>
            <div><b>+{resultState.progress[lesson.id]?.xp ?? 0}</b><small>баллов</small></div>
            <div><b>+{resultState.progress[lesson.id]?.stars ?? 0}</b><small>звёзд</small></div>
          </div>
          <div className="result-message">{perfect ? '🏆 Все ответы правильные! Котёнок-Почемучка гордится тобой.' : completedResult.score >= Math.ceil(completedResult.total * .7) ? '💡 Отличный результат! Ещё немного практики — и будет идеально.' : '🌱 Ошибки помогают учиться. Повтори сложные вопросы и попробуй ещё раз.'}</div>
          <div className="result-reward"><span>🏅</span><div><b>{perfect ? 'Новая победа!' : 'Твоя награда'}</b><small>{perfect ? 'Ты прошёл урок без ошибок.' : 'За завершение урока ты получил опыт и звёзды.'}</small></div></div>
          <div className="result-actions">
            {nextLesson && <button className="primary" onClick={() => { sync(resultState); location.hash = '/lesson:' + nextLesson.id }}>К следующему уроку →</button>}
            <button className={nextLesson ? 'secondary' : 'primary'} onClick={() => done(resultState)}>Вернуться к обучению</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <button className="back" onClick={back}>← Назад</button>
      <div className="lesson-head card">
        <div className="lesson-topline"><span className="lesson-world-badge">📚 Учусь</span><span className="lesson-step-pill">Вопрос {step + 1} / {lesson.steps.length}</span></div>
        <div className="lesson-progress-meta"><span>Твой прогресс</span><strong>{Math.round((step / Math.max(1, lesson.steps.length)) * 100)}%</strong></div>
        <h1>{lesson.title}</h1><p>{lesson.description}</p>
        <div className="progress"><i style={{ width: (step / Math.max(1, lesson.steps.length) * 100) + '%' }} /></div>
      </div>
      <div className="card activity-card">
        {act.type === 'quiz' ? <QuizActivity key={act.id} activity={act} timerSeconds={timerSeconds} onResult={result} onAttempt={onAttempt} />
          : act.type === 'drag_drop' ? <DragDropActivity key={act.id} activity={act} onResult={result} onAttempt={onAttempt} />
          : act.type === 'matching' ? <MatchingActivity key={act.id} activity={act} onResult={result} onAttempt={onAttempt} />
          : act.type === 'sorting' ? <SortingActivity key={act.id} activity={act} onResult={result} onAttempt={onAttempt} />
          : <div className="activity"><h2>Это задание пока недоступно</h2><p className="muted">Мы ещё не подключили этот тип задания. Вернись к урокам и выбери другое задание.</p><button className="primary next-step" type="button" onClick={back}>Вернуться к урокам →</button></div>}
      </div>
      <div className="activity-guide"><Mascot mood="thinking" /><div><b>Котёнок-Почемучка</b><span>Не спеши. Подумай и выбери ответ самостоятельно.</span></div></div>
    </section>
  )
}
