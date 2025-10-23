/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEFAULT_MAP_CENTER_LAT: string
  readonly VITE_DEFAULT_MAP_CENTER_LNG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
