import { NextResponse } from 'next/server';
import { pinecone, groq, getIndex } from '@/utils/clients';

export async function POST(req) {
  try {
    const insightQuery = "main topics, themes, and key takeaways";
    
    const embeddingResponse = await pinecone.inference.embed({
      model: "multilingual-e5-large",
      inputs: [insightQuery],
      parameters: { inputType: "query", truncate: "END" }
    });
    
    const queryEmbedding = embeddingResponse.data[0].values;

    const index = getIndex();
    const queryResult = await index.query({
      vector: queryEmbedding,
      topK: 10,
      includeMetadata: true,
    });

    const contexts = queryResult.matches.map(match => match.metadata.text);
    const contextString = contexts.join('\n\n---\n\n');

    if (!contextString) {
      return NextResponse.json({ error: 'No content found to generate insights. Please upload content first.' }, { status: 400 });
    }

    const prompt = `You are an expert content strategist. Analyze the provided content and generate a structured JSON response with insights.
    
Based on the following content, generate:
1. Key Topics (an array of 3-5 main topics covered)
2. New Content Ideas (an array of 3 creative ideas for future blog posts based on this content)
3. CTA Suggestions (an array of 3 Call-To-Action ideas for the current content)

Return ONLY a valid JSON object with the keys "keyTopics", "newContentIdeas", and "ctaSuggestions". Do not include any other text or markdown formatting.

Content:
${contextString}
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: "json_object" }, 
    });

    const responseContent = completion.choices[0]?.message?.content;
    let insights;
    
    try {
      insights = JSON.parse(responseContent);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", responseContent);
      insights = { error: "Failed to generate structured insights." };
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
