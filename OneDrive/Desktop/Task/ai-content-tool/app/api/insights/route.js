import { NextResponse } from 'next/server';
import { groq } from '@/utils/clients';

export async function POST(req) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Please provide a topic to generate insights.' }, { status: 400 });
    }

    const apiKey = process.env.NEWSDATA_API_KEY;
    const newsUrl = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(topic)}&language=en`;
    
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (!newsData.results || newsData.results.length === 0) {
      return NextResponse.json({ error: `No live news found for the topic: ${topic}` }, { status: 404 });
    }

    // Prepare context from news and extract sources
    const sources = [];
    const newsContextString = newsData.results.slice(0, 5).map(article => {
      // Collect sources to return to the user
      sources.push({
        title: article.title,
        publisher: article.source_id || 'News Source',
        url: article.link
      });
      return `Title: ${article.title}\nDescription: ${article.description || article.content}\nPublisher: ${article.source_id}`;
    }).join('\n\n---\n\n');

    const prompt = `You are a premium AI news analyst. Analyze the following real-time news articles about "${topic}" and generate a highly structured JSON response.
    
Based on the news content, generate:
1. "executiveSummary": A professional, concise 2-3 sentence overview of the current situation.
2. "keyTopics": An array of 3-5 main topics or trends discussed in the news.
3. "metrics": An array of numerical data, percentages, or statistics mentioned in the text. Format each item exactly like this: { "label": "Growth Rate", "value": 25, "unit": "%" }. If no exact numbers exist, infer reasonable dummy metrics based on the sentiment for demonstration purposes.
4. "ctaSuggestions": An array of 3 strategic recommendations for a business or investor based on this news.

Return ONLY a valid JSON object. Do not include any markdown formatting or extra text.

Live News Content:
${newsContextString}
`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: "json_object" }, 
    });

    const responseContent = completion.choices[0]?.message?.content;
    let insights;
    
    try {
      insights = JSON.parse(responseContent);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", responseContent);
      return NextResponse.json({ error: "Failed to generate structured insights from news." }, { status: 500 });
    }

    // Attach the sources to the final response
    insights.sources = sources;

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating live insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
