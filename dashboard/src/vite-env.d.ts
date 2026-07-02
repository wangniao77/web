/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string
  readonly VITE_DEFAULT_VIEW: string
  readonly VITE_MOCK_COLLEGE_ID: string
  readonly VITE_MOCK_STUDENT_ID: string
  readonly VITE_API_BASE: string
  readonly VITE_COLLEGE_COCKPIT_URL: string
  readonly VITE_UNIVERSITY_COCKPIT_URL: string
  readonly VITE_STUDENT_COCKPIT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
