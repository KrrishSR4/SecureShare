import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBucket() {
  const { data, error } = await supabase.storage.updateBucket('secureshare-storage', {
    public: false,
    allowedMimeTypes: null,
    fileSizeLimit: 104857600 // 100MB
  });

  if (error) {
    console.error('Error updating bucket:', error);
  } else {
    console.log('Successfully updated bucket to 100MB limit:', data);
  }
}

updateBucket();
