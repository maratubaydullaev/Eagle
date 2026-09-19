export function Mascot({ mood = 'normal' }: { mood?: 'normal' | 'happy' | 'sad' | 'thinking' }) {
  const mouth =
    mood === 'sad'
      ? 'M43 70 Q50 64 57 70'
      : mood === 'happy'
        ? 'M42 66 Q50 76 58 66'
        : 'M43 69 Q50 73 57 69'
  const eyeY = mood === 'thinking' ? 58 : 61

  return (
    <svg viewBox="0 0 120 120" className={`mascot mascot-${mood}`} aria-label="Котёнок-Почемучка" role="img">
      <ellipse cx="60" cy="73" rx="39" ry="35" fill="#F59B5B" />
      <path d="M27 51 L31 17 L51 43 ZM93 51 L89 17 L69 43 Z" fill="#F59B5B" />
      <path d="M34 53 Q60 39 86 53 L81 82 Q60 94 39 82 Z" fill="#FFFDFB" />
      <path d="M45 83 L60 89 L75 83" fill="none" stroke="#E7E7E7" strokeWidth="2" />
      <path d="M45 83 L60 89 L75 83 L73 103 L60 111 L47 103 Z" fill="#EAF7FF" />
      <path d="M53 91 L60 97 L67 91 L64 107 L56 107 Z" fill="#E94D62" />
      <ellipse cx="43" cy={eyeY} rx="4.5" ry="6" fill="#4E9B5B" />
      <ellipse cx="77" cy={eyeY} rx="4.5" ry="6" fill="#4E9B5B" />
      <ellipse cx="44" cy={eyeY - 1} rx="1.5" ry="1.5" fill="#fff" />
      <ellipse cx="78" cy={eyeY - 1} rx="1.5" ry="1.5" fill="#fff" />
      <path d={mouth} stroke="#7A3E2A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="68" r="3" fill="#E86C4A" />

      {/* Paws */}
      <path d="M28 58 Q19 69 27 77" fill="none" stroke="#F59B5B" strokeWidth="7" strokeLinecap="round" />
      <path d="M92 58 Q101 69 93 77" fill="none" stroke="#F59B5B" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}
