import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('secureshare-storage', {
    public: false,
    allowedMimeTypes: null,
    fileSizeLimit: 52428800 // 50MB
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
      console.log('Bucket already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Successfully created bucket:', data);
  }
}

createBucket();
