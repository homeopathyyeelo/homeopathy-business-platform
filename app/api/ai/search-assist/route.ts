import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 });
    }

    // Use OpenAI to understand and enhance the search query
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a homeopathy medicine search assistant. Help users find medicines by understanding their queries.
          
Rules:
- Understand common misspellings and abbreviations
- Recognize potency formats (30C, 200, 1M, Q, MT)
- Identify medicine categories (dilution, mother tincture, bio combination, biochemic)
- Suggest correct medicine names
- Handle partial names

Examples:
- "arnika" → "Arnica Montana"
- "sulfer 30" → "Sulphur 30C"
- "bc 1" → "Bio Combination 1" or "BC-1"
- "calc phos" → "Calcarea Phosphorica"
- "mother tincture arnica" → "Arnica Montana Q"

Return JSON with:
{
  "suggestion": "Human-readable suggestion",
  "searchTerms": "Optimized search terms for database",
  "category": "dilution|mother_tincture|bio_combination|biochemic|patent|other"
}`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 200,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI search assist error:', error);
    
    // Fallback to basic search enhancement
    const query = (await request.json()).query;
    const enhanced = enhanceSearchQuery(query);
    
    return NextResponse.json({
      suggestion: `Searching for: ${enhanced}`,
      searchTerms: enhanced,
      category: 'other',
    });
  }
}

// Fallback function for basic search enhancement
function enhanceSearchQuery(query: string): string {
  let enhanced = query.trim().toLowerCase();

  // Common abbreviations
  const abbreviations: Record<string, string> = {
    'mt': 'mother tincture',
    'bc': 'bio combination',
    'calc': 'calcarea',
    'phos': 'phosphorica',
    'sulph': 'sulphur',
    'arn': 'arnica',
    'bell': 'belladonna',
    'bry': 'bryonia',
    'cham': 'chamomilla',
    'merc': 'mercurius',
    'nat': 'natrum',
    'nux': 'nux vomica',
    'puls': 'pulsatilla',
    'rhus': 'rhus tox',
    'sep': 'sepia',
  };

  // Replace abbreviations
  Object.entries(abbreviations).forEach(([abbr, full]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    enhanced = enhanced.replace(regex, full);
  });

  // Add potency format if missing
  if (/\b(30|200|1m|10m|50m|cm)\b/i.test(enhanced) && !/\b(30c|200c|1m|10m|50m|cm)\b/i.test(enhanced)) {
    enhanced = enhanced.replace(/\b30\b/gi, '30C');
    enhanced = enhanced.replace(/\b200\b/gi, '200C');
  }

  return enhanced;
}
