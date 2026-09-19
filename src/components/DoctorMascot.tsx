export function ForestScene(){return <svg className="forest-scene" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#79D5F4"/><stop offset="1" stopColor="#C7EFF5"/></linearGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B8E58E"/><stop offset="1" stopColor="#75C875"/></linearGradient>
  </defs>
  <rect width="1200" height="520" fill="url(#sky)"/>
  <circle cx="105" cy="85" r="58" fill="#fff" opacity=".28"/><circle cx="185" cy="72" r="40" fill="#fff" opacity=".2"/>
  <path d="M0 350 Q180 250 350 350 T700 340 T1050 320 T1200 350 V520 H0Z" fill="url(#hill)"/>
  <g opacity=".98">
    <rect x="70" y="205" width="34" height="170" rx="17" fill="#7A593D"/><circle cx="88" cy="190" r="74" fill="#65B95B"/><circle cx="45" cy="220" r="48" fill="#76C968"/><circle cx="125" cy="225" r="52" fill="#57AD55"/>
    <rect x="1020" y="210" width="34" height="165" rx="17" fill="#7A593D"/><circle cx="1037" cy="190" r="76" fill="#63B85A"/><circle cx="1095" cy="225" r="54" fill="#79CC68"/><circle cx="985" cy="225" r="48" fill="#55AB52"/>
    <rect x="270" y="255" width="24" height="120" rx="12" fill="#805D40"/><circle cx="282" cy="242" r="54" fill="#7CCF69"/>
    <rect x="900" y="255" width="24" height="120" rx="12" fill="#805D40"/><circle cx="912" cy="242" r="54" fill="#7CCF69"/>
  </g>
  <path d="M0 395 Q300 330 600 405 T1200 390 V520 H0Z" fill="#8BD36F"/>
  <g fill="#FFF4B0"><circle cx="165" cy="415" r="7"/><circle cx="215" cy="435" r="5"/><circle cx="1025" cy="420" r="6"/></g>
</svg>}

export function DoctorMascot({ mood = 'happy' }: { mood?: 'happy' | 'thinking' }) {
  const blink = mood === 'thinking' ? 0.92 : 1
  return <svg viewBox="0 0 300 330" className="doctor-mascot" role="img" aria-label="Котёнок-Доктор">
    <g>
      <path d="M58 105 L70 25 L118 83 M242 105 L230 25 L182 83" fill="#F59B5B" stroke="#E57F3D" strokeWidth="5" strokeLinejoin="round"/>
      <path d="M83 83 Q150 42 217 83 L210 160 Q150 204 90 160 Z" fill="#FFFDFB"/>
      <path d="M95 107 Q108 94 122 107 M178 107 Q192 94 205 107" fill="none" stroke="#6D3C2D" strokeWidth="6" strokeLinecap="round"/>
      <ellipse cx="110" cy="123" rx="18" ry="22" fill="#4E9B5B" transform={`scale(1 ${blink}) translate(0 ${123*(1-blink)})`}/>
      <ellipse cx="190" cy="123" rx="18" ry="22" fill="#4E9B5B" transform={`scale(1 ${blink}) translate(0 ${123*(1-blink)})`}/>
      <circle cx="115" cy="117" r="6" fill="#fff"/><circle cx="195" cy="117" r="6" fill="#fff"/>
      <path d="M105 98 L125 98 M175 98 L195 98" stroke="#303A42" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="150" cy="138" r="7" fill="#E86C4A"/><path d="M132 145 Q150 166 168 145" fill="none" stroke="#7A3E2A" strokeWidth="6" strokeLinecap="round"/>
      <path d="M85 159 Q150 188 215 159 L210 250 Q150 282 90 250 Z" fill="#FFF" stroke="#D9E8EF" strokeWidth="4"/>
      <path d="M150 188 V275" stroke="#D9E8EF" strokeWidth="4"/><path d="M126 195 L150 212 L174 195 L168 258 L150 272 L132 258 Z" fill="#E94D62"/>
      <path d="M92 172 Q54 205 72 244" fill="none" stroke="#F59B5B" strokeWidth="24" strokeLinecap="round"/><circle cx="72" cy="244" r="18" fill="#F59B5B"/>
      <path d="M208 177 Q245 194 250 224" fill="none" stroke="#F59B5B" strokeWidth="24" strokeLinecap="round"/>
      <path d="M224 214 L284 236 L267 272 L207 247 Z" fill="#DDEAF2" stroke="#708995" strokeWidth="5"/>
      <circle cx="247" cy="240" r="13" fill="#6C8390"/><circle cx="269" cy="248" r="8" fill="#6C8390"/>
      <path d="M106 88 Q150 60 194 88" fill="none" stroke="#DDE5EA" strokeWidth="10"/>
      <circle cx="150" cy="72" r="22" fill="#D7E1E7" stroke="#708995" strokeWidth="5"/><circle cx="150" cy="72" r="8" fill="#708995"/>
    </g>
  </svg>
}
