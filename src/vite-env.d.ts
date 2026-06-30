/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
  // Secondary "JOBBOT" Supabase project, exposed for an in-progress feature.
  readonly VITE_JOBBOT_SUPABASE_URL: string;
  readonly VITE_JOBBOT_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@fontsource-variable/dm-sans";
declare module "@fontsource/dm-serif-display";
