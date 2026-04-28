import { NextResponse } from 'next/server';
import { pinecone, getIndex } from '@/utils/clients';

export async function POST(req) {
  try {
    const { contents } = await req.json();

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return NextResponse.json({ error: 'Please provide an array of contents' }, { status: 400 });
    }

    const index = getIndex();
    let vectors = [];
    
    for (let i = 0; i < contents.length; i++) {
      const text = contents[i];
      const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 20);
      
      for (let j = 0; j < chunks.length; j++) {
        const chunkText = chunks[j];
        
        // Generate embedding using Pinecone SDK with correct object parameter
        const embeddingResponse = await pinecone.inference.embed({
          model: 'multilingual-e5-large',
          inputs: [chunkText],
          parameters: { inputType: 'passage', truncate: 'END' }
        });
        
        const embedding = embeddingResponse.data[0].values;
        const id = `doc-${i}-chunk-${j}-${Date.now()}`;
        
        vectors.push({
          id,
          values: embedding,
          metadata: {
            text: chunkText,
            source: `Content Piece ${i + 1}`,
            createdAt: new Date().toISOString()
          }
        });
      }
    }

    if (vectors.length > 0) {
      await index.upsert({ records: vectors });
    }

    return NextResponse.json({ success: true, message: `Successfully ingested ${vectors.length} chunks.` });
  } catch (error) {
    console.error('Error ingesting data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
