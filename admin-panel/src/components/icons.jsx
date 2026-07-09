/**
 * Small set of thin-line (1.5px stroke) icons, per DESIGN.md's "Precision
 * Iconography" guidance — kept inline as plain SVG instead of pulling in
 * an icon library dependency for ~12 glyphs.
 */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const DashboardIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="5" rx="1.5" />
    <rect x="13" y="12" width="8" height="9" rx="1.5" />
    <rect x="3" y="15" width="8" height="6" rx="1.5" />
  </svg>
);

export const PillIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="9" width="18" height="8" rx="4" transform="rotate(-30 12 13)" />
    <line x1="10.5" y1="7.5" x2="14.5" y2="17.5" transform="rotate(-30 12 13)" />
  </svg>
);

export const CategoryIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const OrderIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 7h16l-1.5 12.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5L4 7Z" />
    <path d="M8 7V5.5A4 4 0 0 1 12 1.5a4 4 0 0 1 4 4V7" />
  </svg>
);

export const UsersIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <circle cx="17.5" cy="8.5" r="2.6" />
    <path d="M15.5 13.2c2.8.2 5 2.4 5.5 6.3" />
  </svg>
);

export const PaymentIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
    <line x1="2.5" y1="9.5" x2="21.5" y2="9.5" />
    <line x1="6" y1="14.5" x2="10" y2="14.5" />
  </svg>
);

export const ReportIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M4 20V10M11 20V4M18 20v-7" />
  </svg>
);

export const RoleIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 2.5 4 5.8v5.4c0 5 3.4 8.5 8 10.3 4.6-1.8 8-5.3 8-10.3V5.8L12 2.5Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const AuditIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M6 3.5h9.5L19 7v13.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
    <path d="M14.5 3.5V7H19" />
    <line x1="8" y1="12" x2="15" y2="12" />
    <line x1="8" y1="15.5" x2="13" y2="15.5" />
  </svg>
);

export const LogoutIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M9 4.5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3" />
    <path d="M15.5 16.5 21 12l-5.5-4.5" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const SearchIcon = (props) => (
  <svg {...base} {...props} width={16} height={16}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="19" y1="19" x2="15.2" y2="15.2" />
  </svg>
);

export const DownloadIcon = (props) => (
  <svg {...base} {...props} width={16} height={16}>
    <path d="M12 3v13" />
    <path d="m6 11 6 6 6-6" />
    <path d="M4.5 20h15" />
  </svg>
);
