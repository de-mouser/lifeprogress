// seed-config.mjs
// Run with: node seed-config.mjs
// This inserts the owner config row into Supabase so login works.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HASH = '$2a$12$h7rYgE9o2CH2t2p5DBq7rOq6n/UIn2zEOfoA7bHruMvu23Yw0P0Jm';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing env vars. Make sure .env.local exists.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const { data: existing } = await supabase
  .from('app_config')
  .select('id')
  .single();

if (existing) {
  console.log('✅  app_config already exists — login should work!');
  process.exit(0);
}

const { error } = await supabase.from('app_config').insert({
  deployment_date: new Date().toISOString().split('T')[0],
  target_year: 2025,
  timezone: 'Asia/Kolkata',
  owner_secret_hash: HASH,
});

if (error) {
  console.error('❌  Failed to seed app_config:', error.message);
  process.exit(1);
}

console.log('✅  app_config inserted! Owner password is: UNDER100RANK');
