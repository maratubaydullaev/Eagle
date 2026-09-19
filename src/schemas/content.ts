import { z } from 'zod'

export const QuizAnswerSchema = z.object({
  id: z.enum(['0', '1', '2']),
  text: z.string().min(1),
})

export const QuizDataSchema = z.object({
  question: z.string().min(1),
  answers: z.array(QuizAnswerSchema).length(3),
  correctAnswerId: z.enum(['0', '1', '2']),
  explanation: z.string().min(1),
})

export const DragDropDataSchema = z.object({
  items: z.array(z.string().min(1)).min(1),
  targets: z.array(z.string().min(1)).min(1),
  correct: z.array(z.string().min(1)).min(1),
})

export const MatchingDataSchema = z.object({
  pairs: z.array(z.tuple([z.string().min(1), z.string().min(1)])).min(1),
})

export const SortingDataSchema = z.object({
  items: z.array(z.string().min(1)).min(1),
  correctOrder: z.array(z.string().min(1)).min(1),
})

export const MemoryDataSchema = z.object({
  pairs: z.array(z.tuple([z.string().min(1), z.string().min(1)])).min(1),
})

export const FindObjectDataSchema = z.object({
  objects: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
  correctId: z.string().min(1),
})

export const SequenceDataSchema = z.object({
  items: z.array(z.string().min(1)).min(1),
  correctOrder: z.array(z.string().min(1)).min(1),
})

const ActivityBase = {
  id: z.string().min(1),
  title: z.string().min(1),
  instructions: z.string().min(1),
  reward: z.object({
    xp: z.number().optional(),
    stars: z.number().optional(),
  }).optional(),
}

export const ActivitySchema = z.discriminatedUnion('type', [
  z.object({ ...ActivityBase, type: z.literal('quiz'), data: QuizDataSchema }),
  z.object({ ...ActivityBase, type: z.literal('drag_drop'), data: DragDropDataSchema }),
  z.object({ ...ActivityBase, type: z.literal('matching'), data: MatchingDataSchema }),
  z.object({ ...ActivityBase, type: z.literal('sorting'), data: SortingDataSchema }),
  z.object({ ...ActivityBase, type: z.literal('memory'), data: MemoryDataSchema }),
  z.object({ ...ActivityBase, type: z.literal('find_object'), data: FindObjectDataSchema }),
  z.object({ ...ActivityBase, type: z.literal('sequence'), data: SequenceDataSchema }),
])

export const LessonSchema = z.object({
  id: z.string().min(1),
  worldId: z.string().min(1),
  topicId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  grade: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  ageMin: z.number(),
  ageMax: z.number(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  learningGoal: z.array(z.string()),
  orderIndex: z.number(),
  steps: z.array(ActivitySchema),
})
