import type { ReactNode } from 'react'

const Svg = ({ children }: { children: ReactNode }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

export const IconPaste = () => (
  <Svg>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4V3h6v1M9 13h6M12 10v6" />
  </Svg>
)

export const IconImage = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M3 17l5-5 4 4 3-3 6 6" />
  </Svg>
)

export const IconTextPlus = () => (
  <Svg>
    <path d="M3 7V5h12v2M9 5v12M6 17h6M18 11v6M15 14h6" />
  </Svg>
)

export const IconTrash = () => (
  <Svg>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </Svg>
)

export const IconDownload = () => (
  <Svg>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M4 20h16" />
  </Svg>
)

export const IconSize = () => (
  <Svg>
    <path d="M3 19L8.5 5l5.5 14M5.3 14h6.4M15.5 19l2.8-7 2.7 7M16.4 17h3.8" />
  </Svg>
)