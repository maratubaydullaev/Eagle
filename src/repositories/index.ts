import type{AppState,ChildProfile,LessonProgress}from'../app/types'
export interface AppRepository{saveProfile(profile:ChildProfile):Promise<void>;getProfile():Promise<ChildProfile|null>;saveProgress(progress:LessonProgress):Promise<void>;getAllProgress():Promise<LessonProgress[]>;loadState():Promise<AppState>}
export class LocalRepository implements AppRepository{
 private read(){try{return JSON.parse(localStorage.getItem('pochemuchka_state_v1')||'{}')}catch{return {}}}
 private write(s:any){localStorage.setItem('pochemuchka_state_v1',JSON.stringify(s))}
 async saveProfile(profile:ChildProfile){const s=this.read();this.write({...s,profile})}
 async getProfile(){return this.read().profile||null}
 async saveProgress(p:LessonProgress){const s=this.read();this.write({...s,progress:{...(s.progress||{}),[p.lessonId]:p}})}
 async getAllProgress(){return Object.values(this.read().progress||{}) as LessonProgress[]}
 async loadState(){const s=this.read(),profile=await this.getProfile(),progress=await this.getAllProgress();return{profile,progress:Object.fromEntries(progress.map(p=>[p.lessonId,p])),activityMastery:s.activityMastery||{},xp:progress.reduce((n,p)=>n+p.xp,0),stars:progress.reduce((n,p)=>n+p.stars,0),lastLessonId:s.lastLessonId}}
}