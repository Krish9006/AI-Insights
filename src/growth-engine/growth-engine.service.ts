import { Injectable } from '@nestjs/common';

@Injectable()
export class GrowthEngineService {
  private getApiKey(): string {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Groq API Key not configured in .env file.');
    }
    return apiKey;
  }

  private async callGroq(messages: any[]): Promise<string> {
    const apiKey = this.getApiKey();
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to call Groq API');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (e) {
      console.error('Groq AI API Error in GrowthEngineService:', e);
      throw e;
    }
  }

  private sanitizeJsonString(raw: string): string {
    // Replace raw control characters inside JSON string values.
    // Iterates character by character — when inside a JSON string literal,
    // it escapes bare newlines (\n), carriage returns (\r), and tabs (\t)
    // so JSON.parse doesn't throw "Bad control character" errors.
    let result = '';
    let inString = false;
    let escape = false;

    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];

      if (escape) {
        result += ch;
        escape = false;
        continue;
      }

      if (ch === '\\' && inString) {
        escape = true;
        result += ch;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        result += ch;
        continue;
      }

      if (inString) {
        // Escape raw control characters that are illegal inside JSON strings
        if (ch === '\n') { result += '\\n'; continue; }
        if (ch === '\r') { result += '\\r'; continue; }
        if (ch === '\t') { result += '\\t'; continue; }
        if (ch === '\b') { result += '\\b'; continue; }
        if (ch === '\f') { result += '\\f'; continue; }
      }

      result += ch;
    }

    return result;
  }

  private parseJsonResponse(response: string): any {
    const trimmed = response.trim();

    const braceIndex = trimmed.indexOf('{');
    const bracketIndex = trimmed.indexOf('[');

    let startIndex = -1;
    let endIndex = -1;

    if (braceIndex !== -1 && (bracketIndex === -1 || braceIndex < bracketIndex)) {
      startIndex = braceIndex;
      endIndex = trimmed.lastIndexOf('}');
    } else if (bracketIndex !== -1) {
      startIndex = bracketIndex;
      endIndex = trimmed.lastIndexOf(']');
    }

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const extracted = trimmed.substring(startIndex, endIndex + 1);
      return JSON.parse(this.sanitizeJsonString(extracted));
    }

    const cleanJson = trimmed.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(this.sanitizeJsonString(cleanJson));
  }

  // Simple in-memory daily cache: { date: "YYYY-MM-DD", trends: [...] }
  private trendsCache: { date: string; trends: any[] } | null = null;

  async getDailyTrends(forceRefresh = false) {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    // Skip cache if force-refresh requested, otherwise use today's cache
    if (!forceRefresh && this.trendsCache && this.trendsCache.date === today) {
      return this.trendsCache.trends;
    }

    // Clear the cache so a fresh set is generated
    if (forceRefresh) {
      this.trendsCache = null;
    }

    const prompt = `You are a Japanese HR market intelligence analyst for Kaika AI.
Today is ${today}. Generate exactly 4 FRESH, UNIQUE, and CURRENT Japanese workforce and HR trends that are relevant RIGHT NOW in ${new Date().getFullYear()}.

Each trend must be DIFFERENT from these common ones (do NOT repeat these):
- Shinsotsu hiring rule changes
- 2024 logistics overtime problem
- Hybrid office generational gaps
- High-context stress / 'Wa' in tech startups

Pick trends that are timely, specific, and grounded in real Japanese HR, labor law, or organizational dynamics.
Examples of angles you CAN use: AI replacement anxiety in white-collar Japan, aging workforce in manufacturing, female leadership quotas (Joseino Katsuyaku), mental health destigmatization, DEI in Japanese MNCs, gig economy regulation, reskilling mandates, silent resignation among Gen Z, etc.

Output ONLY a JSON array with exactly 4 objects following this schema:
[
  {
    "id": "trend-1",
    "title": "Short English trend title (max 10 words)",
    "titleJa": "Japanese title",
    "source": "Credible Japanese or international source name (e.g. MHLW, Nikkei, Japan Times, Keidanren, Tokyo Chamber of Commerce)",
    "summary": "2-sentence English summary explaining the workforce impact and why HR leaders should care."
  }
]
No pre-text, post-text, markdown fences, or explanations. Only valid JSON.`;

    try {
      const response = await this.callGroq([
        { role: 'system', content: 'You are a professional JSON generator. Only respond with valid JSON arrays.' },
        { role: 'user', content: prompt },
      ]);

      const trends = this.parseJsonResponse(response);

      // Cache the result for today
      this.trendsCache = { date: today, trends };
      return trends;
    } catch (e) {
      console.error('Failed to generate dynamic trends, falling back to defaults:', e);
      // Fallback to static trends if AI call fails
      return [
        {
          id: 'trend-1',
          title: 'AI Automation Anxiety Among Japanese White-Collar Workers',
          titleJa: 'ホワイトカラー労働者のAI自動化不安と職場変革',
          source: 'Nikkei Business / Recruit Works Institute',
          summary: 'As generative AI tools penetrate Japanese offices, employees fear skill obsolescence and reduced headcount. HR teams are urgently rethinking reskilling frameworks to manage anxiety-driven turnover.',
        },
        {
          id: 'trend-2',
          title: 'Female Leadership Quota Pressure on Japanese Corporations',
          titleJa: '女性活躍推進法の強化と管理職登用の課題',
          source: 'Cabinet Office Japan / Keidanren 2026 Report',
          summary: 'New government mandates require large firms to hit female management ratio targets by 2030. Companies that lack structured pathways are experiencing compliance risk and brand damage.',
        },
        {
          id: 'trend-3',
          title: 'Gen Z Silent Resignation Wave in Japanese Enterprises',
          titleJa: '日本企業におけるZ世代のサイレントレジグネーション拡大',
          source: 'Japan Institute for Labour Policy and Training',
          summary: 'Younger employees are quietly disengaging rather than voicing dissatisfaction, making traditional retention indicators unreliable. HR leaders need real-time pulse signals to detect disengagement before departure.',
        },
        {
          id: 'trend-4',
          title: 'Mental Health Destigmatization in Japanese Workplaces',
          titleJa: '職場メンタルヘルスの脱スティグマ化と産業医活用',
          source: 'Ministry of Health, Labour and Welfare (MHLW)',
          summary: 'Revised occupational health laws push companies to provide proactive mental health support, but cultural taboos prevent uptake. Organizations investing in anonymous digital wellness tools see measurable retention uplift.',
        },
      ];
    }
  }


  async generateIdeas(trend: string): Promise<any[]> {
    const prompt = `You are Kaika AI's Chief Growth Strategist. 
We need to generate content ideas for our "Knowledge Engine" based on this Japanese workforce trend: "${trend}".
Generate exactly 3 content item proposals. Each proposal must have:
- Category (Choose from: "Workforce Continuity", "Organizational Intelligence", "Case Studies", "White Papers")
- Title (Bilingual, professional English and Japanese)
- Subtitle (Bilingual)
- SearchTarget (Target search platforms like Google, Perplexity, ChatGPT)
- Rationale (Bilingual, explaining why this matters for GEO/SEO)

Output your response ONLY in JSON format following this exact schema:
[
  {
    "category": "category name",
    "titleEn": "English Title",
    "titleJa": "Japanese Title",
    "subtitleEn": "English Subtitle",
    "subtitleJa": "Japanese Subtitle",
    "searchTarget": "Perplexity, Google, ChatGPT",
    "rationaleEn": "English SEO rationale",
    "rationaleJa": "Japanese SEO rationale"
  }
]
Do not include any pre-text, post-text, markdown fences (except the json formatting itself), or explanations. Return clean JSON.`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are a professional JSON generator. Only respond with valid JSON arrays.' },
      { role: 'user', content: prompt }
    ]);

    return this.parseJsonResponse(response);
  }

  async generateDraft(title: string, category: string) {
    const prompt = `You are a premium, evidence-based copywriter specializing in Japanese organizational psychology. 
Write a high-quality cornerstone resource draft titled: "${title}" in the category of "${category}".

The content must follow the Kaika AI Philosophy: bridging individual purpose (Ikigai) with organizational performance (early risk warnings, HSI - Human Signal Intelligence, IIF - Ikigai Intelligence Framework).

You must write both:
1. An English version of the content
2. A Japanese version of the content
3. SEO Keywords (Google)
4. GEO Advice: Recommend how to optimize this page so that Generative Engines (Perplexity, ChatGPT, Claude) summarize this article when users query for Japan attrition and workforce burnout.

Output your response ONLY in JSON format following this schema:
{
  "readTimeEn": "X min read",
  "readTimeJa": "読了時間 約X分",
  "en": {
    "title": "English Title",
    "subtitle": "English Subtitle",
    "summary": "Short 2-sentence summary for lists",
    "body": "Full article body in markdown (use ### headers, bullet lists, and code blocks for diagrams if relevant)"
  },
  "ja": {
    "title": "Japanese Title",
    "subtitle": "Japanese Subtitle",
    "summary": "Short 2-sentence summary in Japanese",
    "body": "Full article body in Japanese (use ### headers, bullet lists, and code blocks for diagrams if relevant)"
  },
  "seoKeywords": ["keyword1", "keyword2"],
  "geoAdvice": "Detailed explanation of how Perplexity and ChatGPT index this page"
}
Do not write pre-text, post-text, or explanations. Respond with clean JSON.`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are a professional JSON writer.' },
      { role: 'user', content: prompt }
    ]);

    return this.parseJsonResponse(response);
  }

  async repurposeDraft(content: string) {
    const prompt = `You are a content marketer. Take the following article body:
"${content}"

Generate:
1. An English LinkedIn Post (engaging, includes hooks, bullets, hashtags)
2. A Japanese LinkedIn Post (localized copywriting, polite business tone)
3. A Bilingual Email Newsletter template (incorporating the key findings and a Call-to-Action to book a Kaika AI pilot)

Output your response ONLY in JSON format following this schema:
{
  "linkedinEn": "Text of English post",
  "linkedinJa": "Text of Japanese post",
  "newsletterSubject": "Bilingual Newsletter Subject Line",
  "newsletterBody": "Text of email body"
}
Respond with clean JSON.`;

    const response = await this.callGroq([
      { role: 'system', content: 'You are a professional JSON generator.' },
      { role: 'user', content: prompt }
    ]);

    return this.parseJsonResponse(response);
  }
}
