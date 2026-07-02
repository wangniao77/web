export type IconKind =
  | 'academic'
  | 'practice'
  | 'honors'
  | 'map'
  | 'employment'
  | 'health'
  | 'support'
  | 'students'
  | 'warning'
  | 'trophy'
  | 'potential'
  | 'briefcase'
  | 'heart'
  | 'failRate'
  | 'retake'
  | 'credit'
  | 'community'
  | 'club'
  | 'event'
  | 'award'
  | 'medal'
  | 'honor'
  | 'research'
  | 'innovation'
  | 'male'
  | 'female'
  | 'database'
  | 'coverage'
  | 'placement'
  | 'contract'
  | 'link'
  | 'course'
  | 'venue'
  | 'studySupport'
  | 'jobSupport'
  | 'mental'
  | 'economic'
  | 'dorm'
  | 'calendar'
  | 'clock'
  | 'status'
  | 'riskHigh'
  | 'riskMedium'
  | 'riskLow'
  | 'survey'
  | 'guide'
  | 'resume'
  | 'interview'
  | 'signContract'
  | 'identify'
  | 'notify'
  | 'intervene'
  | 'follow'
  | 'complete'
  | 'home'
  | 'task'
  | 'faculty'
  | 'evaluation'
  | 'settings'
  | 'satisfaction'
  | 'ranking'
  | 'influence'
  | 'funding';

interface DashIconProps {
  kind: IconKind;
  size?: number;
  className?: string;
  stroke?: string;
}

export default function DashIcon({ kind, size = 18, className = '', stroke = '#39e6ff' }: DashIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `dash-icon ${className}`
  };

  switch (kind) {
    case 'academic':
      return (
        <svg {...common}>
          <path d="M4 8.5 12 4.5l8 4-8 4-8-4Z" fill="rgba(57,230,255,0.14)" />
          <path d="M6.5 10.5V16l5.5 3 5.5-3v-5.5" />
        </svg>
      );
    case 'practice':
      return (
        <svg {...common}>
          <path d="M5 20V8l7-4 7 4v12" fill="rgba(57,230,255,0.12)" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case 'honors':
    case 'trophy':
    case 'award':
      return (
        <svg {...common}>
          <path d="M8 5h8v5a4 4 0 0 1-8 0V5Z" fill="rgba(57,230,255,0.14)" />
          <path d="M8 7H5a2 2 0 0 0 2 3M16 7h3a2 2 0 0 1-2 3" />
          <path d="M12 14v3M9 20h6" />
        </svg>
      );
    case 'map':
      return (
        <svg {...common}>
          <path d="M4 6.5 9 4.5l5 2 6-2.5V18l-6 2.5-5-2-5 2V6.5Z" fill="rgba(57,230,255,0.12)" />
          <path d="M9 4.5v14M14 6.5v14" />
        </svg>
      );
    case 'employment':
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="4" y="8" width="16" height="11" rx="2" fill="rgba(57,230,255,0.14)" />
          <path d="M9 8V6.5A3 3 0 0 1 15 6.5V8M4 12h16" />
        </svg>
      );
    case 'health':
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.4-7-9.1a4.1 4.1 0 0 1 7-2.6 4.1 4.1 0 0 1 7 2.6C19 15.6 12 20 12 20Z" fill="rgba(57,230,255,0.14)" />
        </svg>
      );
    case 'support':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v6c0 4.2 3 7.8 7 9 4-1.2 7-4.8 7-9V6l-7-3Z" fill="rgba(57,230,255,0.12)" />
          <path d="M12 8v5M9.5 10.5h5" />
        </svg>
      );
    case 'students':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" fill="rgba(57,230,255,0.14)" />
          <path d="M3.5 19.5v-1.2c0-2.2 2.5-3.8 5.5-3.8s5.5 1.6 5.5 3.8v1.2" />
          <circle cx="17.5" cy="9" r="2.2" />
          <path d="M21 19.5v-.8c0-1.4-1.2-2.6-2.8-3" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common} stroke="#ffb82e">
          <path d="M12 4.5 20.5 19H3.5L12 4.5Z" fill="rgba(255,184,46,0.16)" />
          <path d="M12 10v4" />
          <circle cx="12" cy="16.5" r=".8" fill="#ffb82e" stroke="none" />
        </svg>
      );
    case 'potential':
      return (
        <svg {...common}>
          <path d="m12 4 2 6h6.5l-5.2 3.8 2 6.2L12 16.3 8.7 20l2-6.2L5.5 10H12Z" fill="rgba(57,230,255,0.14)" />
        </svg>
      );
    case 'failRate':
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="2" fill="rgba(57,230,255,0.1)" />
          <path d="M9 9h6M9 12h4M9 15h5" />
        </svg>
      );
    case 'retake':
      return (
        <svg {...common}>
          <path d="M7 7.5A6.5 6.5 0 0 1 17 9" />
          <path d="M17 7v2.5H14.5M17 16.5A6.5 6.5 0 0 1 7 15" />
          <path d="M7 17v-2.5h2.5" />
        </svg>
      );
    case 'credit':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" fill="rgba(57,230,255,0.1)" />
          <path d="M12 8.5v7M9.5 11h5" />
        </svg>
      );
    case 'community':
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="2.5" fill="rgba(57,230,255,0.14)" />
          <circle cx="16" cy="9" r="2.5" fill="rgba(57,230,255,0.14)" />
          <path d="M4.5 18c0-2.5 2.2-4 3.5-4s3.5 1.5 3.5 4M12 18c0-2.5 2.2-4 3.5-4s3.5 1.5 3.5 4" />
        </svg>
      );
    case 'club':
      return (
        <svg {...common}>
          <path d="M6 6h12v12H6z" fill="rgba(57,230,255,0.1)" />
          <path d="M9 10h6M9 14h4" />
        </svg>
      );
    case 'event':
      return (
        <svg {...common}>
          <rect x="5" y="6" width="14" height="13" rx="2" fill="rgba(57,230,255,0.1)" />
          <path d="M9 4v3M15 4v3M5 10h14" />
        </svg>
      );
    case 'medal':
      return (
        <svg {...common}>
          <circle cx="12" cy="10" r="4.5" fill="rgba(57,230,255,0.14)" />
          <path d="M9.5 13.5 8 20l4-2 4 2-1.5-6.5" />
        </svg>
      );
    case 'honor':
      return (
        <svg {...common}>
          <path d="M12 3.5l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L6.2 7.7l4-.6L12 3.5Z" fill="rgba(57,230,255,0.14)" />
        </svg>
      );
    case 'research':
      return (
        <svg {...common}>
          <path d="M10 4h4l1 5-3 2-3-2 1-5Z" fill="rgba(57,230,255,0.14)" />
          <path d="M12 11v4M9.5 19h5l-1.2-4H10.7L9.5 19Z" />
        </svg>
      );
    case 'innovation':
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <circle cx="12" cy="12" r="4.5" fill="rgba(57,230,255,0.14)" />
        </svg>
      );
    case 'male':
      return (
        <svg {...common}>
          <circle cx="10" cy="14" r="4" fill="rgba(57,230,255,0.14)" />
          <path d="M13.5 10.5 18 6M18 6h-3.5M18 6v3.5" />
        </svg>
      );
    case 'female':
      return (
        <svg {...common} stroke="#ff8ec8">
          <circle cx="12" cy="9" r="4" fill="rgba(255,142,200,0.14)" />
          <path d="M12 13v5M9.5 16.5h5" />
        </svg>
      );
    case 'database':
      return (
        <svg {...common}>
          <ellipse cx="12" cy="7" rx="6.5" ry="2.5" fill="rgba(57,230,255,0.14)" />
          <path d="M5.5 7v10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V7" />
          <path d="M5.5 12c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" />
        </svg>
      );
    case 'coverage':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" fill="rgba(57,230,255,0.1)" />
          <path d="M8.5 12.5 11 15l4.5-5" />
        </svg>
      );
    case 'placement':
      return (
        <svg {...common}>
          <path d="M5 18V9l7-4 7 4v9" fill="rgba(57,230,255,0.1)" />
          <path d="M9.5 18v-5h5v5" />
        </svg>
      );
    case 'contract':
      return (
        <svg {...common}>
          <path d="M7 5h10v14H7z" fill="rgba(57,230,255,0.1)" />
          <path d="M10 9h4M10 12h4M10 15h2.5" />
        </svg>
      );
    case 'link':
      return (
        <svg {...common}>
          <path d="M10 8.5a3.5 3.5 0 0 1 5 0l1.5 1.5a3.5 3.5 0 0 1-5 5L10 14" />
          <path d="M14 15.5a3.5 3.5 0 0 1-5 0L7.5 14a3.5 3.5 0 0 1 5-5l1.5 1.5" />
        </svg>
      );
    case 'course':
      return (
        <svg {...common}>
          <rect x="5" y="6" width="14" height="12" rx="2" fill="rgba(57,230,255,0.1)" />
          <path d="M8 10h8M8 13h5" />
        </svg>
      );
    case 'venue':
      return (
        <svg {...common}>
          <path d="M4.5 19.5 12 5l7.5 14.5H4.5Z" fill="rgba(57,230,255,0.1)" />
          <path d="M9.5 15.5h5" />
        </svg>
      );
    case 'studySupport':
      return (
        <svg {...common}>
          <path d="M6 6.5h12v11H6z" fill="rgba(57,230,255,0.1)" />
          <path d="M9 10h6M9 13h4" />
        </svg>
      );
    case 'jobSupport':
      return (
        <svg {...common}>
          <rect x="5" y="8" width="14" height="10" rx="2" fill="rgba(57,230,255,0.1)" />
          <path d="M9 8V6.5A3 3 0 0 1 15 6.5V8" />
        </svg>
      );
    case 'mental':
      return (
        <svg {...common}>
          <path d="M12 20c3.5-2.5 5.5-5.2 5.5-8.3A5.5 5.5 0 0 0 6.5 11.7C6.5 14.8 8.5 17.5 12 20Z" fill="rgba(57,230,255,0.1)" />
        </svg>
      );
    case 'economic':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" fill="rgba(57,230,255,0.1)" />
          <path d="M12 7.5v9M9.5 10h4a2 2 0 1 1 0 4h-2.5" />
        </svg>
      );
    case 'dorm':
      return (
        <svg {...common}>
          <path d="M4.5 10.5 12 6l7.5 4.5V19h-15V10.5Z" fill="rgba(57,230,255,0.1)" />
          <path d="M9.5 19v-4.5h5V19" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="5" y="6" width="14" height="13" rx="2" fill="rgba(57,230,255,0.1)" />
          <path d="M9 4v3M15 4v3M5 10h14" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" fill="rgba(57,230,255,0.1)" />
          <path d="M12 8.5V12l2.5 2" />
        </svg>
      );
    case 'status':
      return (
        <svg {...common}>
          <path d="M6.5 12.5a5.5 5.5 0 0 1 11 0" fill="rgba(57,230,255,0.1)" />
          <path d="M8 16.5h8" />
        </svg>
      );
    case 'riskHigh':
      return (
        <svg {...common} stroke="#ff7e6f">
          <circle cx="12" cy="12" r="7.5" fill="rgba(255,94,94,0.16)" />
          <path d="M12 8.5v4.5" />
          <circle cx="12" cy="16" r=".8" fill="#ff7e6f" stroke="none" />
        </svg>
      );
    case 'riskMedium':
      return (
        <svg {...common} stroke="#ffd166">
          <path d="M12 5.5 18.5 17H5.5L12 5.5Z" fill="rgba(255,209,102,0.14)" />
          <path d="M12 10v3.5" />
        </svg>
      );
    case 'riskLow':
      return (
        <svg {...common} stroke="#ffd878">
          <circle cx="12" cy="12" r="7.5" fill="rgba(255,216,120,0.12)" />
          <path d="M12 10v5" />
          <circle cx="12" cy="16.5" r=".8" fill="#ffd878" stroke="none" />
        </svg>
      );
    case 'survey':
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="5.5" fill="rgba(57,230,255,0.12)" />
          <path d="M14.5 14.5 18 18" />
        </svg>
      );
    case 'guide':
      return (
        <svg {...common}>
          <path d="M6 7.5h12M6 12h8M6 16.5h10" />
          <circle cx="17" cy="16.5" r="2.5" fill="rgba(57,230,255,0.14)" />
        </svg>
      );
    case 'resume':
      return (
        <svg {...common}>
          <path d="M7 5h10v14H7z" fill="rgba(57,230,255,0.1)" />
          <path d="M10 9h4M10 12h4M10 15h2.5" />
        </svg>
      );
    case 'interview':
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="2.5" fill="rgba(57,230,255,0.14)" />
          <path d="M5.5 17.5v-1.5c0-1.8 1.6-3 3.5-3s3.5 1.2 3.5 3v1.5" />
          <path d="M15.5 10.5h3v6h-3z" fill="rgba(57,230,255,0.1)" />
        </svg>
      );
    case 'signContract':
      return (
        <svg {...common}>
          <path d="M6 6.5h12v11H6z" fill="rgba(57,230,255,0.1)" />
          <path d="M9.5 14.5 11 16l3.5-4" />
        </svg>
      );
    case 'identify':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" fill="rgba(57,230,255,0.1)" />
          <path d="M9.5 12.5 11.5 14.5 15 10.5" />
        </svg>
      );
    case 'notify':
      return (
        <svg {...common}>
          <path d="M12 5.5a4.5 4.5 0 0 1 4.5 4.5v3l1.5 2h-12l1.5-2v-3A4.5 4.5 0 0 1 12 5.5Z" fill="rgba(57,230,255,0.1)" />
          <path d="M10.5 17a1.5 1.5 0 0 0 3 0" />
        </svg>
      );
    case 'intervene':
      return (
        <svg {...common}>
          <path d="M7 18 12 6l5 12" fill="rgba(57,230,255,0.1)" />
          <path d="M9.5 14h5" />
        </svg>
      );
    case 'follow':
      return (
        <svg {...common}>
          <path d="M5.5 12.5a6.5 6.5 0 0 1 11 0" />
          <path d="M12 12.5v5.5M9.5 16h5" />
        </svg>
      );
    case 'complete':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" fill="rgba(57,230,255,0.1)" />
          <path d="M9 12.5 11 14.5 15.5 10" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M5 11.5 12 5l7 6.5V19H5v-7.5Z" fill="rgba(57,230,255,0.12)" />
          <path d="M10 19v-5h4v5" />
        </svg>
      );
    case 'task':
      return (
        <svg {...common}>
          <rect x="5" y="5" width="14" height="14" rx="2" fill="rgba(57,230,255,0.1)" />
          <path d="M9 9.5h6M9 12.5h4M9 15.5h5" />
        </svg>
      );
    case 'faculty':
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3" fill="rgba(57,230,255,0.14)" />
          <path d="M5.5 19.5v-1c0-2.5 2.9-4.5 6.5-4.5s6.5 2 6.5 4.5v1" />
          <path d="M16.5 8.5h2.5v3M19 10H16" />
        </svg>
      );
    case 'evaluation':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" fill="rgba(57,230,255,0.1)" />
          <path d="M12 8v4l2.5 2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.5" fill="rgba(57,230,255,0.14)" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M17 7l1.4-1.4M5.6 18.4l1.4-1.4" />
        </svg>
      );
    case 'satisfaction':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" fill="rgba(57,230,255,0.1)" />
          <path d="M8.5 10.5a1.5 1.5 0 0 1 3 0M12.5 10.5a1.5 1.5 0 0 1 3 0" />
          <path d="M9 14.5c.8 1 2.2 1.5 3 1.5s2.2-.5 3-1.5" />
        </svg>
      );
    case 'ranking':
      return (
        <svg {...common}>
          <path d="M7 18V10l5-3 5 3v8" fill="rgba(57,230,255,0.1)" />
          <path d="M10 18V13h4v5" />
        </svg>
      );
    case 'influence':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" fill="rgba(57,230,255,0.14)" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
          <path d="M5.6 5.6l1.4 1.4M17 17l1.4 1.4M17 7l1.4-1.4M5.6 18.4l1.4-1.4" />
        </svg>
      );
    case 'funding':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" fill="rgba(57,230,255,0.1)" />
          <path d="M12 7.5v9M9.5 10h4a2 2 0 1 1 0 4h-2.5" />
        </svg>
      );
  }
}
