/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string
  readonly VITE_DEFAULT_VIEW: string
  readonly VITE_MOCK_COLLEGE_ID: string
  readonly VITE_MOCK_STUDENT_ID: string
  readonly VITE_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
