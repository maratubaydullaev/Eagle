export function DoctorMascot({ mood = 'happy' }: { mood?: 'happy' | 'thinking' }) {
  const blink = mood === 'thinking' ? 0.92 : 1
  return (
    <svg viewBox="0 0 260 300" className="doctor-mascot" role="img" aria-label="Котёнок-Доктор">
      <g transform="translate(18 12)">
        <path d="M48 92 L57 30 L96 73 M171 92 L162 30 L123 73" fill="#F59B5B" stroke="#E78343" strokeWidth="4" strokeLinejoin="round"/>
        <path d="M65 63 Q110 38 155 63 L151 128 Q110 164 69 128 Z" fill="#FFFDFB"/>
        <path d="M76 91 Q87 78 99 91" fill="none" stroke="#6A392B" strokeWidth="5" strokeLinecap="round"/>
        <path d="M121 91 Q133 78 144 91" fill="none" stroke="#6A392B" strokeWidth="5" strokeLinecap="round"/>
        <ellipse cx="88" cy="103" rx="15" ry="19" fill="#4E9B5B" transform={`scale(1 ${blink}) translate(0 ${103*(1-blink)})`}/>
        <ellipse cx="136" cy="103" rx="15" ry="19" fill="#4E9B5B" transform={`scale(1 ${blink}) translate(0 ${103*(1-blink)})`}/>
        <circle cx="92" cy="98" r="5" fill="#fff"/><circle cx="140" cy="98" r="5" fill="#fff"/>
        <circle cx="112" cy="119" r="6" fill="#E86C4A"/>
        <path d="M97 124 Q112 141 127 124" fill="none" stroke="#7A3E2A" strokeWidth="5" strokeLinecap="round"/>
        <path d="M64 129 Q110 151 156 129 L151 185 Q110 205 69 185 Z" fill="#FFFDFB" stroke="#DCE9EE" strokeWidth="3"/>
        <path d="M110 151 L110 204" stroke="#DCE9EE" strokeWidth="3"/>
        <path d="M91 157 L110 170 L129 157 L125 198 L110 211 L95 198 Z" fill="#E94D62"/>
        <path d="M72 132 Q50 155 60 184" fill="none" stroke="#F59B5B" strokeWidth="20" strokeLinecap="round"/>
        <circle cx="59" cy="183" r="14" fill="#F59B5B"/>
        <path d="M151 139 Q190 150 194 184" fill="none" stroke="#F59B5B" strokeWidth="20" strokeLinecap="round"/>
        <path d="M174 176 L222 195 L209 222 L161 202 Z" fill="#DDEAF2" stroke="#708995" strokeWidth="4"/>
        <circle cx="190" cy="202" r="11" fill="#6C8390"/><circle cx="211" cy="210" r="7" fill="#6C8390"/>
        <path d="M77 72 Q110 53 143 72" fill="none" stroke="#DDEAF2" strokeWidth="8"/>
        <circle cx="110" cy="61" r="18" fill="#D7E1E7" stroke="#708995" strokeWidth="4"/>
        <circle cx="110" cy="61" r="7" fill="#708995"/>
      </g>
    </svg>
  )
}
