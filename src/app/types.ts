import type { z } from 'zod'
import type { ActivitySchema } from '../schemas/content'

export type Activity = z.infer<typeof ActivitySchema>
export type ActivityType = Activity['type']

export type LessonStatus='locked'|'available'|'in_progress'|'completed'
export type Grade=1|2|3

export interface ChildProfile{id:string;name:string;age:number;grade:Grade;avatar:string;createdAt:string;updatedAt:string}

export interface Lesson{id:string;worldId:string;topicId:string;title:string;description:string;grade:Grade;ageMin:number;ageMax:number;difficulty:1|2|3;learningGoal:string[];orderIndex:number;steps:Activity[]}
export interface Topic{id:string;worldId:string;title:string;description:string;orderIndex:number}
export interface World{id:string;title:string;description:string;icon:string;orderIndex:number;isActive:boolean}
export interface LessonProgress{id:string;profileId:string;lessonId:string;status:LessonStatus;score:number;mastery:number;attempts:number;startedAt?:string;completedAt?:string;nextReviewAt?:string;xp:number;stars:number}
export interface ActivityAttempt{id?:string;profileId:string;activityId:string;isCorrect:boolean;answer?:unknown;timeSpent?:number;createdAt?:string}
export interface AppState{profile:ChildProfile|null;progress:Record<string,LessonProgress>;xp:number;stars:number;purchasedGifts:string[];lastLessonId?:string}
