
import { createClient } from
  'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://xxymgmpfmpmzqbspibzi.supabase.co';

const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HUYq3krqCZymAPPWq2ebiQ_3-4RLptE';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
