import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  try {
    const res = await pc.inference.embed(
      'multilingual-e5-large',
      ['hello world'],
      { inputType: 'passage', truncate: 'END' }
    );
    console.log("Success with positional:", res);
  } catch(e) {
    console.error("Error with positional:", e.message);
  }
}
test();
