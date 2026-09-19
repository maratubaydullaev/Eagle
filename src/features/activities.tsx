import { useEffect, useState } from 'react'
import type { Activity } from '../app/types'
import { audio, telegram } from '../services/core'

type Attempt = (ok: boolean, answer?: unknown, timeSpent?: number) => void | Promise<void>

function reportAttempt(onAttempt: Attempt, ok: boolean, answer: unknown, timeSpent: number) {
  try {
    void Promise.resolve(onAttempt(ok, answer, timeSpent)).catch(() => {})
  } catch {
    // Attempt persistence must never block the gameplay transition.
  }
}

export function QuizActivity({ activity, onResult, onAttempt, timerSeconds = 15 }: { activity: Activity; onResult: (ok: boolean) => void; onAttempt: Attempt; timerSeconds?: number }) {
  const d = activity.data as any
  const [answer, setAnswer] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(timerSeconds)
  const [startedAt] = useState(() => Date.now())
  useEffect(() => { if (answer) return; const id = window.setInterval(() => setRemaining(v => Math.max(0, v - 1)), 1000); return () => window.clearInterval(id) }, [answer])
  useEffect(() => {
    if (remaining !== 0 || answer) return
    setAnswer('__timeout__')
    reportAttempt(onAttempt, false, null, Date.now() - startedAt)
    try { audio.wrong() } catch {}
    try { telegram.haptic('error') } catch {}
  }, [remaining, answer, onAttempt, onResult, startedAt])
  function pick(id: string) {
    if (answer) return
    setAnswer(id)
    const ok = id === d.correctAnswerId
    reportAttempt(onAttempt, ok, id, Date.now() - startedAt)
    try { ok ? audio.correct() : audio.wrong() } catch {}
    try { telegram.haptic(ok ? 'success' : 'error') } catch {}
  }
  return <div className="activity">
    <div className="activity-meta"><span>⏱ {remaining} сек.</span></div>
    <h2>{d.question}</h2>
    <div className="answers">{d.answers.map((x: any) => <button key={x.id} disabled={!!answer} className={answer ? (x.id === d.correctAnswerId ? 'correct' : x.id === answer ? 'wrong' : '') : 'answer'} onClick={() => pick(x.id)}>{x.text}</button>)}</div>
    {answer && <>
      <div className={answer === d.correctAnswerId ? 'feedback good' : 'feedback bad'} role="status">{answer === '__timeout__' ? 'Время вышло ⏱️' : answer === d.correctAnswerId ? 'Отлично! 🎉' : 'Почти! 💡 ' + d.explanation}</div>
      <button className="primary next-step" type="button" onClick={() => onResult(answer === d.correctAnswerId)}>{'Следующий вопрос →'}</button>
    </>}
  </div>
}

export function DragDropActivity({ activity, onResult, onAttempt }: { activity: Activity; onResult: (ok: boolean) => void; onAttempt: Attempt }) {
  const d = activity.data as any
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [placed, setPlaced] = useState<Record<string, string>>({})
  const [wrong, setWrong] = useState(false)
  const [finished, setFinished] = useState(false)
  const [startedAt] = useState(() => Date.now())

  function chooseItem(item: string) {
    if (finished || Object.values(placed).includes(item)) return
    setSelectedItem(item)
    setWrong(false)
  }

  function chooseTarget(target: string) {
    if (finished || placed[target] || !selectedItem) return

    const index = d.targets.indexOf(target)
    const ok = d.correct[index] === selectedItem
    reportAttempt(onAttempt, ok, { item: selectedItem, target }, Date.now() - startedAt)

    if (!ok) {
      setWrong(true)
      try { audio.wrong() } catch {}
      return
    }

    try { audio.correct() } catch {}
    const next = { ...placed, [target]: selectedItem }
    setPlaced(next)
    setSelectedItem(null)
    setWrong(false)
    if (Object.keys(next).length === d.targets.length) setFinished(true)
  }

  return <div className="activity">
    <h2>{activity.instructions}</h2>
    <div className="drag-items">
      {d.items.map((item: string) =>
        <button
          key={item}
          type="button"
          disabled={finished || Object.values(placed).includes(item)}
          className={selectedItem === item ? 'selected' : Object.values(placed).includes(item) ? 'matched' : ''}
          aria-pressed={selectedItem === item}
          onClick={() => chooseItem(item)}
        >
          {item}
        </button>
      )}
    </div>
    <div className="targets">
      {d.targets.map((target: string) =>
        <button
          key={target}
          type="button"
          disabled={finished || !!placed[target] || !selectedItem}
          className={'target target-button' + (placed[target] ? ' matched' : '')}
          onClick={() => chooseTarget(target)}
        >
          <b>{target}</b>
          <span>{placed[target] || (selectedItem ? 'Выбери это соответствие' : 'Сначала выбери первый элемент')}</span>
        </button>
      )}
    </div>
    {wrong && !finished && <div className="feedback bad" role="status">Не подходит. Попробуй другую пару 💪</div>}
    {finished && <>
      <div className="feedback good" role="status">Все пары найдены! 🎉</div>
      <button className="primary next-step" type="button" onClick={() => onResult(true)}>
        Следующий вопрос →
      </button>
    </>}
  </div>
}

export function MatchingActivity({ activity, onResult, onAttempt }: { activity: Activity; onResult: (ok: boolean) => void; onAttempt: Attempt }) {
  const d = activity.data as any
  const [selected, setSelected] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const [finished, setFinished] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [startedAt] = useState(() => Date.now())
  const pairs = new Map<string, string>(d.pairs)

  function choose(value: string) {
    if (finished || done.includes(value)) return
    if (!selected) {
      setSelected(value)
      return
    }

    const first = selected
    const ok = pairs.get(first) === value || pairs.get(value) === first

    if (ok) {
      const next = [...done, first, value]
      setDone(next)
      setSelected(null)
      setWrong(false)
      if (next.length === d.pairs.length * 2) setFinished(true)
    } else {
      setSelected(null)
      setWrong(true)
      try { audio.wrong() } catch {}
    }

    reportAttempt(onAttempt, ok, { first, second: value }, Date.now() - startedAt)
  }

  const left = d.pairs.map((pair: string[]) => pair[0])
  const right = d.pairs.map((pair: string[]) => pair[1]).reverse()

  return <div className="activity">
    <h2>{activity.instructions}</h2>
    <div className="match-columns">
      <div className="match-column">
        <h3>Выбери первый элемент</h3>
        <div className="match-options">
          {left.map((value: string) =>
            <button
              key={value}
              disabled={finished || done.includes(value)}
              className={selected === value ? 'selected' : done.includes(value) ? 'matched' : ''}
              aria-pressed={selected === value}
              onClick={() => choose(value)}
            >
              {value}
            </button>
          )}
        </div>
      </div>
      <div className="match-column">
        <h3>Выбери пару</h3>
        <div className="match-options">
          {right.map((value: string) =>
            <button
              key={value}
              disabled={finished || done.includes(value)}
              className={selected === value ? 'selected' : done.includes(value) ? 'matched' : ''}
              aria-pressed={selected === value}
              onClick={() => choose(value)}
            >
              {value}
            </button>
          )}
        </div>
      </div>
    </div>
    {wrong && !finished && <div className="feedback bad" role="status">Эта пара не подходит. Попробуй ещё раз 💪</div>}
    {finished && <>
      <div className="feedback good" role="status">Все пары найдены! 🎉</div>
      <button className="primary next-step" type="button" onClick={() => onResult(true)}>
        Следующий вопрос →
      </button>
    </>}
  </div>
}
