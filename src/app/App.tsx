import{useEffect,useRef,useState}from'react';import type{ReactNode}from'react';import type{AppState,ChildProfile,Lesson,LeaderboardEntry}from'./types';import{storage,learning,audio,telegram,ageAdaptation,gradeForAge}from'../services/core';import{backend}from'../services/backend';import{lessons,worlds,topics}from'../content/content';import{Mascot}from'../components/Mascot';import{QuizActivity,DragDropActivity,MatchingActivity}from'../features/activities';
function Shell({children,state,goHome,nav,route}:{children:ReactNode;state:AppState;goHome:()=>void;nav:(r:string)=>void;route:string}){return <main className="app"><header className="top"><button className="brand" onClick={goHome}><Mascot mood="happy"/><span><b>ПОЧЕМУЧКИ</b><small>Учимся легко и с интересом</small></span></button><div className="header-actions"><button className="icon-btn" onClick={()=>{audio.toggle();storage.save(state);location.reload()}} aria-label="Звук">{audio.enabled?'🔊':'🔇'}</button></div></header>{children}<BottomNav nav={nav} route={route}/></main>}

function Profile({onDone}:{onDone:(p:ChildProfile)=>void}){const[n,setN]=useState(telegram.firstName());const[a,setA]=useState(6);function save(){if(!n.trim())return;const now=new Date().toISOString();onDone({id:crypto.randomUUID(),name:n.trim(),age:a,grade:gradeForAge(a),avatar:'🐱',createdAt:now,updatedAt:now})}return <section className="screen center"><div className="hero"><Mascot mood="happy"/><h1>Привет! Я Кот-Почемучка</h1><p>Будем узнавать новое, играть и открывать мир.</p></div><label>Как тебя зовут?<input value={n} onChange={e=>setN(e.target.value.slice(0,20))} placeholder="Например, Амина" autoFocus/></label><label>Сколько тебе лет?</label><div className="chips">{[4,5,6,7,8,9,10].map(x=><button className={a===x?'chip active':'chip'} key={x} onClick={()=>setA(x)}>{x}</button>)}</div><button className="primary" disabled={!n.trim()} onClick={save}>Начать приключение →</button></section>}
function BottomNav({nav,route}:{nav:(r:string)=>void;route:string}){const learningActive=route==='progress'||route.startsWith('world:')||route.startsWith('lesson:');const rewardsActive=route==='achievements';const profileActive=route==='parent';return <nav className="bottom-nav" aria-label="Основная навигация"><button className={route==='home'?'active':''} onClick={()=>nav('home')}><span>⌂</span><small>Главная</small></button><button className={learningActive?'active':''} onClick={()=>nav('progress')}><span>📚</span><small>Учусь</small></button><button className={rewardsActive?'active':''} onClick={()=>nav('achievements')}><span>🏆</span><small>Награды</small></button><button className={profileActive?'active':''} onClick={()=>nav('parent')}><span>👤</span><small>Я</small></button></nav>}

function Home({ s, nav }: { s: AppState; nav: (r: string) => void }) {
  const grade = s.profile!.grade || gradeForAge(s.profile!.age)
  const due = Object.values(s.progress).find(
    (p) => p.nextReviewAt && new Date(p.nextReviewAt) <= new Date(),
  )
  const next =
    (s.lastLessonId && s.progress[s.lastLessonId]?.status === 'in_progress'
      ? lessons.find((l) => l.id === s.lastLessonId)
      : due
        ? lessons.find((l) => l.id === due.lessonId)
        : lessons.find((l) => l.grade === grade && !s.progress[l.id])) || null
  const completed = Object.values(s.progress).filter((p) => p.status === 'completed').length

  return (
    <section className="home">
      <div className="home-top">
        <div>
          <p className="eyebrow">ПОЧЕМУЧКИ</p>
          <h1>Привет, {s.profile!.name}! 👋</h1>
          <p className="home-subtitle">Готов узнавать новое?</p>
        </div>
        <div className="home-top-actions">
          <button className="round-action" onClick={() => nav('achievements')} aria-label="Достижения">🏅</button>
          <button className="round-action" onClick={() => { audio.toggle(); storage.save(s); location.reload() }} aria-label="Звук">
            {audio.enabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      <div className="hero-card">
        <div className="hero-copy">
          <span className="hero-badge">Сегодняшняя миссия</span>
          <h2>{next ? 'Продолжим учиться?' : 'Ты всё выполнил!'}</h2>
          <p>{next?.title || 'Все доступные уроки пройдены. Молодец!'}</p>
          <button className="hero-button" disabled={!next} onClick={() => next && nav('lesson:' + next.id)}>
            {next ? 'Начать урок →' : 'Посмотреть достижения'}
          </button>
        </div>
        <div className="hero-mascot"><Mascot mood="happy" /></div>
      </div>

      <div className="stats-strip">
        <div><span>⭐</span><b>{s.xp}</b><small>Баллы</small></div>
        <div><span>✨</span><b>{s.stars}</b><small>Звёзды</small></div>
        <div><span>📚</span><b>{completed}</b><small>Уроков</small></div>
      </div>

      {s.purchasedGifts.length > 0 && (
        <div className="card my-gifts">
          <div className="section-title">
            <h2>🎁 Мои подарки</h2>
            <button onClick={() => nav('progress')}>Все →</button>
          </div>
          <div className="my-gifts-list">
            {s.purchasedGifts.map((id) => (
              <span key={id}>
                {id === 'sticker' ? '🎁 Набор наклеек' : id === 'avatar' ? '🧢 Новый аватар' : '🪄 Волшебный сундук'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="section-title worlds-title">
        <h2>Твои миры</h2>
        <button onClick={() => nav('progress')}>Мой прогресс →</button>
      </div>

      <div className="world-grid">
        {worlds.filter((w) => w.isActive).map((w) => {
          const ls = lessons.filter((l) => l.worldId === w.id && l.grade === grade)
          if (!ls.length) return null
          const done = ls.filter((l) => s.progress[l.id]?.status === 'completed').length
          const width = ls.length ? done / ls.length * 100 : 0
          return (
            <button className="world-card" key={w.id} onClick={() => nav('world:' + w.id)}>
              <span className="world-icon">{w.icon}</span>
              <div className="world-info">
                <b>{w.title}</b>
                <small>{done}/{ls.length} уроков</small>
                <i><em style={{ width: width + '%' }} /></i>
              </div>
              <strong>→</strong>
            </button>
          )
        })}
      </div>

      <div className="motivation-card">
        <Mascot mood="thinking" />
        <div>
          <b>Маленькими шагами — к большим знаниям!</b>
          <span>Котёнок-Доктор поможет, если будет трудно.</span>
        </div>
      </div>
      
    </section>
  )
}

function World({s,id,nav}:{s:AppState;id:string;nav:(r:string)=>void}){const w=worlds.find(x=>x.id===id)!;const grade=s.profile!.grade||gradeForAge(s.profile!.age);const ls=lessons.filter(l=>l.worldId===id&&l.grade===grade).sort((a,b)=>a.orderIndex-b.orderIndex);return <section><button className="back" onClick={()=>nav('home')}>← Назад</button><div className="world-head card"><span>{w.icon}</span><div><h1>{w.title}</h1><p>{w.description}</p></div></div>{topics.filter(t=>t.worldId===id).map(t=><div key={t.id}><h2>{t.title}</h2><p className="muted">{t.description}</p></div>)}<div className="lesson-list">{ls.map(l=>{const st=learning.status(s,l);const retryLocked=st==='completed_locked';return <button className={'lesson-row '+st} disabled={st==='locked'||retryLocked} key={l.id} onClick={()=>nav('lesson:'+l.id)}><span>{s.progress[l.id]?.status==='completed'?'⭐':retryLocked?'⏳':st==='locked'?'🔒':st==='in_progress'?'▶️':'○'}</span><div><b>{l.title}</b><small>{retryLocked?'Повторить можно завтра':l.description}</small></div><strong>{s.progress[l.id]?.status==='completed'?(retryLocked?'Завтра':'Пройдено'):st==='locked'?'Закрыт':st==='in_progress'?'Продолжить →':'Начать →'}</strong></button>})}</div></section>}
function Lesson({s,lesson,done,back,sync}:{s:AppState;lesson:Lesson;done:(s:AppState)=>void;back:()=>void;sync:(s:AppState)=>void}){const[started]=useState(()=>learning.start(s,lesson.id));const[step,setStep]=useState(0);const[completedResult,setCompletedResult]=useState<{score:number;total:number;state:AppState}|null>(null);const pendingAttempts=useRef<Promise<unknown>[]>([]);useEffect(()=>{sync(started)},[started,sync]);const[score,setScore]=useState(0);const act=lesson.steps[step];const timerSeconds=ageAdaptation.timerSeconds(s.profile!.age);useEffect(()=>{void backend.saveProgress(started.progress[lesson.id]);void backend.event('lesson_started',{lessonId:lesson.id})},[started,lesson.id]);async function result(ok:boolean){const ns=score+(ok?1:0);setScore(ns);if(step<lesson.steps.length-1){setStep(x=>x+1);return}try{await Promise.allSettled(pendingAttempts.current)}catch{}const current=storage.load();let next:AppState;try{next=learning.complete(current,lesson,ns)}catch{next=storage.load();const fallback=current.progress[lesson.id];if(fallback){next.progress[lesson.id]={...fallback,status:'completed',score:ns,mastery:Math.max(0,Math.min(1,ns/Math.max(1,lesson.steps.length))),attempts:(fallback.attempts||0)+1,completedAt:new Date().toISOString()};storage.save(next)}}sync(next);void backend.saveProgress(next.progress[lesson.id]).catch(()=>{});void backend.event('lesson_completed',{lessonId:lesson.id,score:ns,total:lesson.steps.length,mastery:next.progress[lesson.id]?.mastery??0});setCompletedResult({score:ns,total:lesson.steps.length,state:next})}function onAttempt(ok:boolean,answer:unknown,timeSpent?:number){try{const n=storage.activityMastery(act.id,ok);const request=backend.saveActivityAttempt({profileId:n.profile!.id,activityId:act.id,isCorrect:ok,answer,timeSpent}).catch(()=>{});pendingAttempts.current.push(request)}catch{}}if(completedResult)return <section><div className="card lesson-result"><div className="result-mascot"><Mascot mood="happy"/></div><p className="eyebrow">УРОК ЗАВЕРШЁН</p><h1>Отличная работа! 🎉</h1><p>{lesson.title}</p><div className="result-score"><div><b>{completedResult.score}/{completedResult.total}</b><small>правильных</small></div><div><b>+{completedResult.state.progress[lesson.id]?.xp ?? 0}</b><small>баллов</small></div><div><b>+{completedResult.state.progress[lesson.id]?.stars ?? 0}</b><small>звезда</small></div></div><div className="result-reward">🏅 Проверь, не открылось ли новое достижение!</div><button className="primary" onClick={()=>done(completedResult.state)}>Вернуться к обучению →</button></div></section>;return <section><button className="back" onClick={back}>← Назад</button><div className="lesson-head card"><div className="lesson-progress-meta"><span>Задание {step+1} из {lesson.steps.length}</span><strong>{Math.round(step/lesson.steps.length*100)}%</strong></div><h1>{lesson.title}</h1><p>{lesson.description}</p><div className="progress"><i style={{width:(step/lesson.steps.length*100)+'%'}}/></div></div><div className="card activity-card">{act.type==='quiz'?<QuizActivity key={act.id} activity={act} timerSeconds={timerSeconds} onResult={result} onAttempt={onAttempt}/>:act.type==='drag_drop'?<DragDropActivity key={act.id} activity={act} onResult={result} onAttempt={onAttempt}/>:act.type==='matching'?<MatchingActivity key={act.id} activity={act} onResult={result} onAttempt={onAttempt}/>:<div className="activity"><h2>Это задание пока недоступно</h2><p className="muted">Мы ещё не подключили этот тип задания. Вернись к урокам и выбери другое задание.</p><button className="primary next-step" type="button" onClick={back}>Вернуться к урокам →</button></div>}</div><div className="activity-guide"><Mascot mood="thinking"/><div><b>Котёнок-Доктор</b><span>Не спеши. Подумай и выбери ответ самостоятельно.</span></div></div></section>}

function Leaderboard({s,back}:{s:AppState;back:()=>void}){const[rows,setRows]=useState<LeaderboardEntry[]>([]);const[loading,setLoading]=useState(true);const[open,setOpen]=useState<string|null>(null);useEffect(()=>{backend.getLeaderboard().then(setRows).catch(()=>setRows([])).finally(()=>setLoading(false))},[]);return <section><button className="back" onClick={back}>← Назад</button><div className="card"><h1>🏆 Рейтинг</h1><p className="muted">Общий рейтинг по баллам за пройденные уроки.</p>{loading?<p>Загружаем рейтинг…</p>:rows.length===0?<p>Рейтинг пока пуст. Пройди первый урок!</p>:<div className="leaderboard">{rows.map(r=><div className={'leader-card '+(r.isCurrentUser?'current':'')} key={r.profileId}><button className="leader-row" type="button" onClick={()=>setOpen(open===r.profileId?null:r.profileId)}><strong>{r.rank}</strong><span className="leader-avatar-wrap"><span className="leader-avatar">{r.avatar}</span><small>{r.completedLessons}/{r.totalLessons}</small></span><div><b>{r.name}</b><small>Участник рейтинга</small></div><em>🏆 {r.points}</em></button>{open===r.profileId&&<div className="leader-lessons">{r.lessons.map(lesson=><div key={lesson.lessonId} className={lesson.completed?'lesson-done':'lesson-pending'}><span>{lesson.completed?'✓':'○'}</span><span>{lesson.title}</span></div>)}</div>}</div>)}</div>}</div></section>}function Progress({s,back,sync}:{s:AppState;back:()=>void;sync:(s:AppState)=>void}){const[tab,setTab]=useState<'rating'|'stars'|'lessons'|null>(null);const[rows,setRows]=useState<LeaderboardEntry[]>([]);const[loading,setLoading]=useState(false);const[purchasing,setPurchasing]=useState<string|null>(null);const grade=s.profile!.grade||gradeForAge(s.profile!.age);const availableLessons=lessons.filter(l=>l.grade===grade).sort((a,b)=>a.orderIndex-b.orderIndex);const completedLessons=availableLessons.filter(l=>s.progress[l.id]?.status==='completed');const weak=s.progress?Object.values(s.progress).filter(p=>p.mastery<.7&&p.attempts>0).map(p=>lessons.find(l=>l.id===p.lessonId)).filter(Boolean):[];function showRating(){setTab('rating');if(!rows.length){setLoading(true);backend.getLeaderboard().then(setRows).catch(()=>setRows([])).finally(()=>setLoading(false))}}const gifts=[{id:'sticker',icon:'🎁',title:'Набор наклеек',cost:5},{id:'avatar',icon:'🧢',title:'Новый аватар',cost:10},{id:'treasure',icon:'🪄',title:'Волшебный сундук',cost:15}];async function buyGift(id:string){if(purchasing)return;const cost=gifts.find(g=>g.id===id)!.cost;setPurchasing(id);try{if(backend.enabled){const fresh=await backend.bootstrap();if(fresh?.profile){storage.save(fresh);sync(fresh);if(fresh.purchasedGifts.includes(id)){setTab('stars');return}if(fresh.stars<cost){setTab('stars');return}}const result=await backend.purchaseGift(id);const latest=await backend.bootstrap();const next=latest?.profile?latest:{...s,stars:result.stars,purchasedGifts:result.purchasedGifts};storage.save(next);sync(next);setTab('stars');location.hash='/progress'}else{if(s.purchasedGifts.includes(id)||s.stars<cost)return;const next=storage.purchaseGift(id);sync(next);setTab('stars')}}catch(error){const message=error instanceof Error?error.message:'Неизвестная ошибка';console.error('gift purchase failed',error);alert(`Не удалось обменять звёзды.
${message}`)}finally{setPurchasing(null)}}return <section><button className="back" onClick={back}>← Назад</button><div className="stats-grid progress-cards"><button className={tab==='rating'?'stat-card active':'stat-card'} onClick={showRating}>🏆<b>{s.xp}</b><small>Баллы</small></button><button className={tab==='stars'?'stat-card active':'stat-card'} onClick={()=>setTab('stars')}>⭐<b>{s.stars}</b><small>Звёзды</small></button><button className={tab==='lessons'?'stat-card active':'stat-card'} onClick={()=>setTab('lessons')}>📚<b>{completedLessons.length}/{availableLessons.length}</b><small>Уроков</small></button></div><div className="card progress-content">{tab===null&&<><h2>Твой прогресс</h2><p>Нажми на любой показатель выше, чтобы посмотреть подробности.</p>{weak.length>0&&<><h3>🔁 Повторение</h3>{weak.map(l=><p key={l!.id}>• {l!.title} {s.progress[l!.id]?.nextReviewAt&&new Date(s.progress[l!.id].nextReviewAt!)<=new Date()?'— уже пора повторить':''}</p>)}</>}</>}{tab==='rating'&&<><h2>🏆 Рейтинг</h2><p className="muted">Твоё место выделено.</p>{loading?<p>Загружаем рейтинг…</p>:rows.length===0?<p>Рейтинг пока пуст.</p>:<div className="leaderboard">{rows.map(r=><div className={'leader-row '+(r.isCurrentUser?'current':'')} key={r.profileId}><strong>{r.rank}</strong><span className="leader-avatar"> {r.avatar}</span><div><b>{r.name}</b><small>{r.isCurrentUser?'Это ты':'Участник'}</small></div><em>🏆 {r.points}</em></div>)}</div>}</>}{tab==='stars'&&<><h2>⭐ Подарки</h2><p className="muted">Обменивай звёзды на награды. Покупка сохраняется в Telegram.</p><div className="gift-grid">{gifts.map(g=>{const bought=s.purchasedGifts.includes(g.id);const canBuy=s.stars>=g.cost&&!bought;return <div className="gift-card" key={g.id}><span>{g.icon}</span><b>{g.title}</b><small>{g.cost} ⭐</small><button disabled={bought||!canBuy||purchasing===g.id} onClick={()=>void buyGift(g.id)}>{bought?'Получено':purchasing===g.id?'Обмениваем…':canBuy?'Обменять':'Не хватает звёзд'}</button></div>})}</div></>}{tab==='lessons'&&<><h2>📚 Уроки</h2><p className="muted">Пройденные и ещё не пройденные уроки.</p><div className="lesson-progress-list">{availableLessons.map(l=>{const done=s.progress[l.id]?.status==='completed';return <div className={done?'lesson-progress-item done':'lesson-progress-item'} key={l.id}><span>{done?'⭐':'○'}</span><div><b>{l.title}</b><small>{done?'Пройден':'Не пройден'}</small></div></div>})}</div></>}</div></section>}
function Achievements({s,back}:{s:AppState;back:()=>void}){const completed=Object.values(s.progress).filter(p=>p.status==='completed').length;const achievements=[{id:'first-lesson',icon:'🎯',title:'Первый урок',text:'Пройди свой первый урок',done:completed>=1},{id:'five-lessons',icon:'📚',title:'5 уроков',text:'Пройди 5 уроков',done:completed>=5},{id:'hundred-points',icon:'🏆',title:'100 баллов',text:'Набери 100 баллов',done:s.xp>=100},{id:'ten-stars',icon:'⭐',title:'10 звёзд',text:'Получи 10 звёзд',done:s.stars>=10},{id:'first-language',icon:'🔤',title:'Первый язык',text:'Пройди первый урок из мира «Языки»',done:Object.values(s.progress).some(p=>p.status==='completed'&&lessons.find(l=>l.id===p.lessonId)?.worldId==='languages')},{id:'world-explorer',icon:'🌍',title:'Исследователь мира',text:'Пройди 3 урока из мира «Природа»',done:Object.values(s.progress).filter(p=>p.status==='completed'&&lessons.find(l=>l.id===p.lessonId)?.worldId==='world').length>=3},{id:'mathematician',icon:'🔢',title:'Математик',text:'Пройди 4 урока из мира «Математика»',done:Object.values(s.progress).filter(p=>p.status==='completed'&&lessons.find(l=>l.id===p.lessonId)?.worldId==='math').length>=4},{id:'animal-friend',icon:'🐾',title:'Друг животных',text:'Пройди 3 урока из мира «Растения и животные»',done:Object.values(s.progress).filter(p=>p.status==='completed'&&lessons.find(l=>l.id===p.lessonId)?.worldId==='animals').length>=3}];return <section><button className="back" onClick={back}>← Назад</button><div className="card achievements-head"><h1>🏅 Достижения</h1><p>Собирай достижения, проходя уроки и открывая новые миры.</p><div className="achievement-count">{achievements.filter(a=>a.done).length} / {achievements.length} открыто</div></div><div className="achievement-grid">{achievements.map(a=><div className={a.done?'achievement-card unlocked':'achievement-card'} key={a.id}><span>{a.icon}</span><div><b>{a.title}</b><small>{a.text}</small></div>{a.done&&<em>✓</em>}</div>)}</div></section>}

function Parent({s,back}:{s:AppState;back:()=>void}){const[open,setOpen]=useState(false);const[v,setV]=useState('');return <section><button className="back" onClick={back}>← Назад</button>{!open?<div className="screen center"><h1>Для родителей</h1><p>Решите пример, чтобы открыть раздел.</p><p><b>7 + 5 = ?</b></p><input inputMode="numeric" value={v} onChange={e=>setV(e.target.value)}/><button className="primary" onClick={()=>v==='12'&&setOpen(true)}>Открыть</button></div>:<div className="card"><h1>Прогресс ребёнка</h1><div className="stats-grid"><div>⏱<b>—</b><small>Время</small></div><div>📚<b>{Object.values(s.progress).filter(p=>p.status==='completed').length}</b><small>Уроков</small></div><div>🏆<b>{s.xp}</b><small>Баллы</small></div></div><h2>Темы для повторения</h2>{Object.values(s.progress).filter(p=>p.mastery<.7).map(p=><p key={p.id}>🔁 {lessons.find(l=>l.id===p.lessonId)?.title}</p>)}</div>}</section>}
export function App(){const[s,setS]=useState<AppState>(storage.load);const[route,setRoute]=useState(location.hash.replace('#/','')||'home');useEffect(()=>{const f=()=>setRoute(location.hash.replace('#/','')||'home');addEventListener('hashchange',f);return()=>removeEventListener('hashchange',f)},[]);useEffect(()=>{if(!backend.enabled)return;let alive=true;const local=storage.load();if(local.profile&&!local.profile.grade){local.profile={...local.profile,grade:gradeForAge(local.profile.age)};storage.save(local)}backend.bootstrap().then(remote=>{if(!alive)return;if(!remote?.profile){if(local.profile){storage.save(local);setS(local);void backend.saveProfile(local.profile).catch(()=>{})}return}const merged={...remote,profile:remote.profile?{...remote.profile,grade:remote.profile.grade||gradeForAge(remote.profile.age)}:remote.profile,lastLessonId:local.lastLessonId||remote.lastLessonId};storage.save(merged);setS(merged)}).catch(()=>{});return()=>{alive=false}},[]);const nav=(r:string)=>{location.hash='/'+r;setRoute(r)};const profileDone=(p:ChildProfile)=>{const n=storage.profile(p);setS(n);void backend.saveProfile(p);void backend.event('profile_created',{age:p.age,grade:p.grade});nav('home')};if(!s.profile)return <main className="app"><Profile onDone={profileDone}/></main>;let body:React.ReactNode;if(route==='home')body=<Home s={s} nav={nav}/>;else if(route.startsWith('world:'))body=<World s={s} id={route.slice(6)} nav={nav}/>;else if(route.startsWith('lesson:')){const l=lessons.find(x=>x.id===route.slice(7));body=l?<Lesson s={s} lesson={l} back={()=>nav('home')} sync={setS} done={x=>{setS(x);nav('home')}}/>:null}else if(route==='progress')body=<Progress s={s} back={()=>nav('home')} sync={setS}/>;else if(route==='leaderboard')body=<Leaderboard s={s} back={()=>nav('home')}/>;else if(route==='achievements')body=<Achievements s={s} back={()=>nav('home')}/>;else if(route==='parent')body=<Parent s={s} back={()=>nav('home')}/>;else body=<Home s={s} nav={nav}/>;return <Shell state={s} goHome={()=>nav('home')} nav={nav} route={route}>{body}</Shell>}
