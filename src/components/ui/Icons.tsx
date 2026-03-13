/** Shared inline SVG icons used across the UI */

export function SpoolIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 15.6695 10.2788"
      fill="currentColor"
      stroke="currentColor"
      strokeMiterlimit="10"
      aria-hidden="true"
    >
      <ellipse fill="none" strokeWidth="0.2" cx="7.7875" cy="2.4958" rx="7.6875" ry="2.3958"/>
      <path stroke="none" fillRule="evenodd" d="M7.7875.1625C3.5418.1625.1,1.1046.1,2.2667s3.4418,2.1041,7.6875,2.1041,7.6875-.9421,7.6875-2.1041S12.0332.1625,7.7875.1625ZM7.7667,2.9018c-1.2815,0-2.3204-.2843-2.3204-.6351s1.0389-.6351,2.3204-.6351,2.3204.2844,2.3204.6351-1.0389.6351-2.3204.6351Z"/>
      <path stroke="none" fillRule="evenodd" d="M12.6844,5.7841l.004,2.012c-3.2736,1.3096-6.5526,1.3069-9.8372.0072l-.0038-1.9008c-1.5637.4596-2.5529,1.1239-2.5529,1.8652,0,1.3868,3.4418,2.5112,7.6875,2.5112s7.6875-1.1243,7.6875-2.5112c0-.8076-1.1719-1.5243-2.9851-1.9836Z"/>
      <path fill="none" strokeWidth="0.5" d="M12.7014,4.3688l.0083,3.455c-3.2738.9745-6.5529.9734-9.8372.008l-.0083-3.455"/>
    </svg>
  )
}

export function ClockIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Thick outer ring */}
      <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3z"/>
      {/* Minute hand — pointing toward 12, rounded ends */}
      <rect x="7.25" y="3.5" width="1.5" height="4.75" rx="0.75"/>
      {/* Hour hand — pointing toward 3, rounded ends */}
      <rect x="8" y="7.25" width="3.5" height="1.5" rx="0.75"/>
    </svg>
  )
}
