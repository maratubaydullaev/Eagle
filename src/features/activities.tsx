import { useEffect, useState } from 'react'
import type { Activity } from '../app/types'
import { audio, telegram } from '../services/core'

type Attempt = (ok: boolean, answer?: unknown, timeSpent?: number) => void | Promise<void>

export function QuizActivity({ activity, onResult, onAttempt, timerSeconds = 15 }: { activity: Activity; onResult: (ok: boolean) => void; onAttempt: Attempt; timerSeconds?: number }) {
  const d = activity.data as any
  const [answer, setAnswer] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(timerSeconds)
  const [startedAt] = useState(() => Date.now())
  useEffect(() => { if (answer) return; const id = window.setInterval(() => setRemaining(v => Math.max(0, v - 1)), 1000); return () => window.clearInterval(id) }, [answer])
  useEffect(() => {
    if (remaining !== 0 || answer) return
    setAnswer('__timeout__')
    void Promise.resolve(onAttempt(false, null, Date.now() - startedAt)).catch(() => {})
    audio.wrong(); telegram.haptic('error')
    window.setTimeout(() => onResult(false), 550)
  }, [remaining, answer, onAttempt, onResult, startedAt])
  async function pick(id: string) {
    if (answer) return
    setAnswer(id)
    const ok = id === d.correctAnswerId
    void Promise.resolve(onAttempt(ok, id, Date.now() - startedAt)).catch(() => {})
    ok ? audio.correct() : audio.wrong()
    telegram.haptic(ok ? 'success' : 'error')
    window.setTimeout(() => onResult(ok), 550)
  }
  return <div className="activity">
    <div className="activity-meta"><span>⏱ {remaining} сек.</span></div>
    <h2>{d.question}</h2>
    <div className="answers">{d.answers.map((x: any) => <button key={x.id} disabled={!!answer} className={answer ? (x.id === d.correctAnswerId ? 'correct' : x.id === answer ? 'wrong' : '') : 'answer'} onClick={() => void pick(x.id)}>{x.text}</button>)}</div>
    {answer && <div className={answer === d.correctAnswerId ? 'feedback good' : 'feedback bad'} role="status">{answer === '__timeout__' ? 'Время вышло ⏱️' : answer === d.correctAnswerId ? 'Отлично! 🎉' : 'Почти! 💡 ' + d.explanation}</div>}
  </div>
}

export function DragDropActivity({ activity, onResult, onAttempt }: { activity: Activity; onResult: (ok: boolean) => void; onAttempt: Attempt }) {
  const d = activity.data as any
  const [items, setItems] = useState<string[]>(d.items)
  const [placed, setPlaced] = useState<string[]>([])
  const [wrong, setWrong] = useState(false)
  const [startedAt] = useState(() => Date.now())
  async function move(item: string, target: string) {
    const index = d.targets.indexOf(target), ok = d.correct[index] === item
    void Promise.resolve(onAttempt(ok, { item, target }, Date.now() - startedAt)).catch(() => {})
    if (ok) {
      const next = [...placed, item]; setPlaced(next); setItems(xs => xs.filter(x => x !== item))
      if (next.length === d.targets.length) window.setTimeout(() => onResult(true), 250)
    } else { setWrong(true); window.setTimeout(() => setWrong(false), 500) }
  }
  return <div className="activity">
    <h2>{activity.instructions}</h2>
    <div className="drag-items">{items.map(x => <button key={x} draggable onDragStart={e => e.dataTransfer.setData('text/plain', x)} onClick={() => void move(x, d.targets[placed.length])} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void move(x, d.targets[placed.length]) } }}>{x}</button>)}</div>
    <div className="targets">{d.targets.map((t: string, i: number) => <div className="target" key={t} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void move(e.dataTransfer.getData('text/plain'), t) }} role="group" aria-label={'Цель: ' + t}><b>{t}</b><span>{placed[i] || 'Перетащи сюда'}</span></div>)}</div>
    {wrong && <div className="feedback bad" role="status">Попробуй ещё раз 💪</div>}
  </div>
}

export function MatchingActivity({ activity, onResult, onAttempt }: { activity: Activity; onResult: (ok: boolean) => void; onAttempt: Attempt }) {
  const d = activity.data as any
  const [selected, setSelected] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const [startedAt] = useState(() => Date.now())
  const pairs = new Map<string, string>(d.pairs)
  async function choose(value: string) {
    if (done.includes(value)) return
    if (!selected) { setSelected(value); return }
    const first = selected, ok = pairs.get(first) === value || pairs.get(value) === first
    void Promise.resolve(onAttempt(ok, { first, second: value }, Date.now() - startedAt)).catch(() => {})
    if (ok) {
      const next = [...done, first, value]; setDone(next); setSelected(null)
      if (next.length === d.pairs.length * 2) window.setTimeout(() => onResult(true), 250)
    } else { setSelected(null); audio.wrong() }
  }
  return <div className="activity">
    <h2>{activity.instructions}</h2>
    <div className="match-grid">{d.pairs.flat().map((value: string) => <button key={value} disabled={done.includes(value)} className={selected === value ? 'selected' : done.includes(value) ? 'matched' : ''} aria-pressed={selected === value} onClick={() => void choose(value)}>{value}</button>)}</div>
  </div>
}
