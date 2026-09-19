import { useEffect, useState } from 'react'
import type { Activity } from '../app/types'
import { audio, telegram } from '../services/core'
import { Mascot } from '../components/Mascot'

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
  return <div className="activity" onPointerDown={() => audio.unlock()}>
    <div className="activity-meta"><span className="activity-type-badge">🧠 Подумай</span><span className={remaining <= 3 ? 'timer-critical' : ''} aria-label={remaining <= 3 ? 'critical' : undefined}>⏱ {remaining} сек.</span></div>
    <div className="question-label">ВОПРОС</div><h2 className="quiz-question">{d.question}</h2>
    <div className="answers">{d.answers.map((x: any) => <button key={x.id} disabled={!!answer} className={answer ? (x.id === d.correctAnswerId ? 'correct' : x.id === answer ? 'wrong' : '') : 'answer'} aria-pressed={answer === x.id} onClick={() => pick(x.id)}>{x.text}</button>)}</div>
    {answer && <>
      <div className={answer === d.correctAnswerId ? 'feedback good' : 'feedback bad'} role="status">{answer === '__timeout__' ? 'Время вышло ⏱️' : answer === d.correctAnswerId ? 'Отлично! 🎉' : 'Почти! 💡 ' + d.explanation}</div>
      <div className="activity-guide"> <Mascot mood={answer === d.correctAnswerId ? 'happy' : 'sad'}/><div><b>{answer === d.correctAnswerId ? 'Отлично!' : 'Почти получилось!'}</b><span>{answer === d.correctAnswerId ? 'Так держать. Переходим дальше.' : 'Разберём ошибку и попробуем снова.'}</span></div></div><button className="primary next-step" type="button" onClick={() => onResult(answer === d.correctAnswerId)}>{'Следующий вопрос →'}</button>
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

  return <div className="activity" onPointerDown={() => audio.unlock()}>
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
    {wrong && !finished && <><div className="feedback bad" role="status">Не подходит. Попробуй другую пару 💪</div><div className="activity-guide"><Mascot mood="sad"/><div><b>Почти!</b><span>Ошибка — это подсказка. Попробуй ещё раз.</span></div></div></>}
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
  const [rightItems] = useState<string[]>(() => {
    const values = d.pairs.map((pair: string[]) => pair[1])
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[values[i], values[j]] = [values[j], values[i]]
    }
    return values
  })
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

  return <div className="activity" onPointerDown={() => audio.unlock()}>
    <h2>{activity.instructions}</h2>
    <div className="match-grid">
      {d.pairs.map((pair: string[], index: number) => {
        const values = [pair[0], rightItems[index]]
        return values.map((value: string) =>
          <button
            key={value}
            disabled={finished || done.includes(value)}
            className={selected === value ? 'selected' : done.includes(value) ? 'matched' : ''}
            aria-pressed={selected === value}
            onClick={() => choose(value)}
          >
            {value}
          </button>
        )
      })}
    </div>
    {wrong && !finished && <><div className="feedback bad" role="status">Эта пара не подходит. Попробуй ещё раз 💪</div><div className="activity-guide"><Mascot mood="sad"/><div><b>Ничего страшного!</b><span>Подумай ещё раз и найди правильную пару.</span></div></div></>}
    {finished && <>
      <div className="feedback good" role="status">Все пары найдены! 🎉</div>
      <button className="primary next-step" type="button" onClick={() => onResult(true)}>
        Следующий вопрос →
      </button>
    </>}
  </div>
}

export function SortingActivity({ activity, onResult, onAttempt }: { activity: Activity; onResult: (ok: boolean) => void; onAttempt: Attempt }) {
  const d = activity.data as any
  const [items, setItems] = useState<string[]>(() => [...d.items])
  const [finished, setFinished] = useState(false)
  const [ok, setOk] = useState<boolean | null>(null)
  const [startedAt] = useState(() => Date.now())

  function move(index: number, direction: -1 | 1) {
    if (finished) return
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return
    const next = [...items]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    setItems(next)
  }

  function check() {
    if (finished) return
    const correct = items.every((item, index) => item === d.correctOrder[index])
    setOk(correct)
    setFinished(true)
    reportAttempt(onAttempt, correct, items, Date.now() - startedAt)
    try { correct ? audio.correct() : audio.wrong() } catch {}
  }

  return <div className="activity" onPointerDown={() => audio.unlock()}>
    <h2>{activity.instructions}</h2>
    <div className="sort-list">
      {items.map((item: string, index: number) =>
        <div className="sort-row" key={item}>
          <strong>{index + 1}</strong>
          <span>{item}</span>
          <button type="button" disabled={finished || index === 0} aria-label={'Переместить ' + item + ' вверх'} onClick={() => move(index, -1)}>↑</button>
          <button type="button" disabled={finished || index === items.length - 1} aria-label={'Переместить ' + item + ' вниз'} onClick={() => move(index, 1)}>↓</button>
        </div>
      )}
    </div>
    {!finished && <button className="primary next-step" type="button" onClick={check}>Проверить порядок →</button>}
    {finished && <>
      <div className={ok ? 'feedback good' : 'feedback bad'} role="status">{ok ? 'Отлично! Порядок верный 🎉' : 'Почти! Попробуй ещё раз и запомни правильную последовательность.'}</div>
      {!ok && <div className="activity-guide"><Mascot mood="thinking"/><div><b>Подсказка</b><span>Сравни свой порядок с тем, что изучали в этом уроке.</span></div></div>}
      <button className="primary next-step" type="button" onClick={() => onResult(!!ok)}>Следующий вопрос →</button>
    </>}
  </div>
}