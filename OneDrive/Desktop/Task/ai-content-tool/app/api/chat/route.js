import { NextResponse } from 'next/server';
import { pinecone, groq, getIndex } from '@/utils/clients';

export async function POST(req) {
  try {
    const { question } = await req.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const embeddingResponse = await pinecone.inference.embed({
      model: "multilingual-e5-large",
      inputs: [question],
      parameters: { inputType: "query", truncate: "END" }
    });
    
    const queryEmbedding = embeddingResponse.data[0].values;

    const index = getIndex();
    const queryResult = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    const contexts = queryResult.matches.map(match => match.metadata.text);
    const contextString = contexts.join('\n\n---\n\n');

    const prompt = `You are a helpful AI assistant. Answer the user's question based ONLY on the following context. If the answer is not in the context, say "I don't have enough information to answer that based on the provided content."

Context:
${contextString}

Question:
${question}

Answer:`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
    });

    const answer = completion.choices[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ answer, contexts: queryResult.matches });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
