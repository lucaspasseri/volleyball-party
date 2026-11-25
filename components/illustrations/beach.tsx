import { useId } from "react";

export function Volleyball({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={id}>
          <circle cx="60" cy="60" r="55" />
        </clipPath>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="#FFF9E9"
        stroke="#163D55"
        strokeWidth="2.5"
      />
      <g clipPath={`url(#${id})`} stroke="#163D55" strokeWidth="2">
        <path
          d="M60 60C35 44 30 23 40 4L70 0C55 23 52 39 60 60Z"
          fill="#F9C943"
        />
        <path
          d="M60 60C64 30 80 16 103 15L121 40C91 34 74 41 60 60Z"
          fill="#2C8CA5"
        />
        <path
          d="M60 60C87 55 108 67 117 85L97 111C93 84 78 67 60 60Z"
          fill="#F9C943"
        />
        <path
          d="M60 60C72 85 65 106 48 120L20 107C47 98 59 79 60 60Z"
          fill="#2C8CA5"
        />
        <path
          d="M60 60C41 80 17 81 0 69L5 38C18 62 40 67 60 60Z"
          fill="#F9C943"
        />
      </g>
    </svg>
  );
}

export function SunDoodle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 150 150"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <circle cx="75" cy="75" r="33" />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M75 9V25" transform={`rotate(${i * 30} 75 75)`} />
        ))}
        <path d="M63 69V73M87 69V73M63 84Q75 96 87 84" />
      </g>
    </svg>
  );
}

export function BeachScene() {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 800 670"
      fill="none"
      role="img"
      aria-label="Praia ilustrada de Copacabana com montanhas, sol, rede de vôlei e guarda-sol"
    >
      <defs>
        <clipPath id={`scene-${id}`}>
          <path d="M91 73Q245-18 440 34Q656-2 745 164Q821 339 744 527Q700 640 490 641L188 635Q33 596 34 428Q-8 214 91 73Z" />
        </clipPath>
        <pattern
          id={`net-${id}`}
          width="23"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M23 0H0V22"
            stroke="#FFF8E8"
            strokeWidth="1.3"
            opacity=".8"
          />
        </pattern>
        <pattern
          id={`sand-${id}`}
          width="44"
          height="41"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M6 12H9M30 30H32"
            stroke="#D1AC68"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity=".55"
          />
        </pattern>
      </defs>
      <g clipPath={`url(#scene-${id})`}>
        <path fill="#F8C74B" d="M0 0H800V670H0Z" />
        <circle cx="558" cy="143" r="70" fill="#FFF2BC" />
        <g stroke="#FFF2BC" strokeWidth="3" strokeLinecap="round">
          <path d="M558 47V28M558 258V239M654 143H673M443 143H462M626 75L639 62M477 224L490 211M626 211L639 224M477 62L490 75" />
        </g>
        <path
          d="M-20 292Q43 244 102 251Q150 165 192 213Q232 121 271 191Q310 228 338 270Q387 256 413 295Z"
          fill="#39796E"
        />
        <path
          d="M172 285Q223 208 245 239Q267 151 284 169Q312 217 322 265Q363 232 401 292Z"
          fill="#246A65"
        />
        <path d="M-10 286Q241 272 800 296V487H-10Z" fill="#3BA7AE" />
        <path
          d="M-10 331Q185 298 352 336T800 326"
          stroke="#8FD0CB"
          strokeWidth="5"
        />
        <path
          d="M120 359Q217 343 287 360M427 322Q502 309 570 324M580 381Q675 355 760 368"
          stroke="#DAEEDB"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M-10 429Q171 348 363 405Q543 469 810 385V670H-10Z"
          fill="#FFF0C7"
        />
        <path
          d="M-10 416Q171 335 363 392Q543 456 810 372"
          stroke="#FDF9E9"
          strokeWidth="15"
        />
        <path
          d="M-10 429Q171 348 363 405Q543 469 810 385V670H-10Z"
          fill={`url(#sand-${id})`}
        />
        <path
          d="M113 548L395 474L663 549L398 632Z"
          stroke="#E49354"
          strokeWidth="3"
        />
        <path d="M395 474L398 632" stroke="#E49354" strokeWidth="2" />
        <path
          d="M215 344V554M582 356V565"
          stroke="#153E53"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M216 348L581 361V456L216 443Z"
          fill="#164E59"
          fillOpacity=".14"
        />
        <path d="M216 348L581 361V456L216 443Z" fill={`url(#net-${id})`} />
        <path
          d="M216 348L581 361M216 442L581 456"
          stroke="#FFF9E9"
          strokeWidth="7"
        />
        <path
          d="M207 548L188 553M575 562L600 567"
          stroke="#153E53"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g transform="translate(656 466) rotate(13)">
          <path d="M0-72V116" stroke="#BA7A3A" strokeWidth="6" />
          <path d="M-95-38Q-63-109 0-110Q63-109 95-38Z" fill="#F16B4C" />
          <path d="M-35-38Q-26-99 0-110Q26-99 35-38Z" fill="#FFF9E9" />
          <path
            d="M-95-38Q-65-24-35-38Q0-24 35-38Q65-24 95-38"
            fill="#F16B4C"
          />
          <path d="M-49 92L38 94L47 129L-40 126Z" fill="#3A9EAC" />
          <path
            d="M-40 104L41 106M-34 115L45 118"
            stroke="#FFF6DB"
            strokeWidth="4"
          />
        </g>
        <g transform="translate(92 416) rotate(-12)">
          <path d="M0 208Q45 88 4-15" stroke="#B27B40" strokeWidth="16" />
          <path d="M5-16Q-64-107-124-45Q-53-64 5-16Z" fill="#1E6C53" />
          <path d="M5-16Q-23-132 48-124Q8-86 5-16Z" fill="#267D59" />
          <path d="M5-16Q69-113 127-52Q62-65 5-16Z" fill="#1E6C53" />
          <path d="M5-16Q95-57 122 17Q58-19 5-16Z" fill="#31835A" />
          <path d="M5-16Q-58-47-84 24Q-38-11 5-16Z" fill="#31835A" />
        </g>
        <g transform="translate(291 552) rotate(-15)">
          <rect width="60" height="38" rx="5" fill="#EF7256" />
          <path d="M0 8H60" stroke="#FFF8E9" strokeWidth="9" />
          <path d="M20-4V-10H40V-4" stroke="#163D55" strokeWidth="3" />
        </g>
      </g>
      <path
        d="M633 47Q695 53 721 88M644 31Q709 37 740 79"
        stroke="#153E53"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M60 156L42 147M70 130L61 108M40 184L17 181"
        stroke="#E9764D"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g transform="translate(506 260) rotate(-12)">
        <path
          d="M0 0Q10-13 20 0Q30-13 40 0"
          stroke="#153E53"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(449 209) scale(.65)">
        <path
          d="M0 0Q10-13 20 0Q30-13 40 0"
          stroke="#153E53"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function Wave({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 41C180 111 360-13 540 33S900 103 1080 42S1320 12 1440 48V90H0Z"
        fill="currentColor"
      />
    </svg>
  );
}
