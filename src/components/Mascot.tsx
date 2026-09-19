export function Mascot({ mood = 'normal' }: { mood?: 'normal' | 'happy' | 'sad' | 'thinking' }) {
  const mouth =
    mood === 'sad'
      ? 'M43 70 Q50 64 57 70'
      : mood === 'happy'
        ? 'M42 66 Q50 76 58 66'
        : 'M43 69 Q50 73 57 69'
  const eyeY = mood === 'thinking' ? 58 : 61

  return (
    <svg viewBox="0 0 120 120" className="mascot" aria-label="Котёнок-Доктор" role="img">
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

      {/* Doctor head mirror */}
      <circle cx="60" cy="31" r="10" fill="#E9C46A" stroke="#8C6A2D" strokeWidth="2" />
      <path d="M60 21 L60 12" stroke="#8C6A2D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="10" r="3" fill="#8C6A2D" />

      {/* Doctor coat and badge */}
      <path d="M28 78 Q24 88 30 101 Q43 111 60 112 Q77 111 90 101 Q96 88 92 78 L82 83 Q75 91 60 94 Q45 91 38 83 Z" fill="#F7FCFF" />
      <circle cx="78" cy="91" r="5" fill="#4C9DFF" stroke="#fff" strokeWidth="2" />
      <path d="M78 88 L78 94 M75 91 L81 91" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />

      {/* Stethoscope */}
      <path d="M39 82 Q34 95 43 101 Q52 107 60 98" fill="none" stroke="#4C9DFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M81 82 Q86 95 77 101 Q68 107 60 98" fill="none" stroke="#4C9DFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="99" r="5" fill="#DCEEFF" stroke="#3B8FE8" strokeWidth="2" />

      {/* Paws */}
      <path d="M28 58 Q19 69 27 77" fill="none" stroke="#F59B5B" strokeWidth="7" strokeLinecap="round" />
      <path d="M92 58 Q101 69 93 77" fill="none" stroke="#F59B5B" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}
