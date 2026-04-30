require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function main() {
  const BUCKET_NAME = process.env.PDF_STORAGE_BUCKET || 'pdfs';
  
  console.log(`Checking/creating bucket: ${BUCKET_NAME}`);
  
  // Try to create the bucket
  const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: false, // We use signed URLs, so private is fine and secure
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Successfully created bucket:', data);
  }
}

main().catch(console.error);
