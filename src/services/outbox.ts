import type { ActivityAttempt, LessonProgress } from '../app/types'
import { backend } from './backend'

// Offline-очередь: вместо .catch(()=>{}) прогресс/попытки сохраняются локально
// и досылаются при следующем bootstrap или при восстановлении сети.
const KEY = 'pochemuchka_outbox_v1'

type OutboxItem =
  | { kind: 'progress'; progress: LessonProgress }
  | { kind: 'attempt'; attempt: Omit<ActivityAttempt, 'id' | 'createdAt'> }

function getStore(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}
function load(): OutboxItem[] {
  try {
    const raw = getStore()?.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}
function save(items: OutboxItem[]) {
  getStore()?.setItem(KEY, JSON.stringify(items))
}

export const outbox = {
  enqueue(item: OutboxItem) {
    const items = load()
    items.push(item)
    save(items)
  },
  async flush() {
    if (!backend.enabled) return
    const items = load()
    if (!items.length) return
    const remaining: OutboxItem[] = []
    for (const item of items) {
      try {
        if (item.kind === 'progress') await backend.saveProgress(item.progress)
        else await backend.saveActivityAttempt(item.attempt)
      } catch {
        // Сеть недоступна — останавливаемся, повтор при следующем flush.
        remaining.push(item)
        break
      }
    }
    save(remaining)
  },
}
