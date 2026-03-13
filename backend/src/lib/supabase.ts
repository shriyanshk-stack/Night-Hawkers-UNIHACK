import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
}

const baseAuthConfig = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, baseAuthConfig);

export const createUserScopedClient = (accessToken: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    ...baseAuthConfig,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
