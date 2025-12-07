import OpenAI from "openai";

const CLARIFY_MODEL = "gpt-4o-mini";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400 }
      );
    }

    const openai = new OpenAI();

    const response = await openai.chat.completions.create({
      model: CLARIFY_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a research assistant that helps refine queries before deep research.

Analyze the user's query and determine if clarifying questions would meaningfully improve the research output.

SKIP clarification (return shouldSkip: true) when:
- The query is already specific and well-defined
- The query has clear scope, timeframe, or criteria
- Additional questions wouldn't meaningfully change the research direction
- The query is a simple factual lookup

ASK clarifying questions (return shouldSkip: false) when:
- The query is vague or ambiguous
- Important context is missing (timeframe, region, industry, etc.)
- The user's intent could be interpreted multiple ways
- Scope needs to be narrowed for useful results

Return a JSON object with this structure:
{
  "shouldSkip": boolean,
  "reason": "brief explanation of why skipping or asking",
  "questions": [
    {
      "question": "The clarifying question",
      "options": ["Option 1", "Option 2", "Option 3"] // optional suggested answers
    }
  ]
}

Keep to 2-3 focused questions maximum. Questions should be concise and actionable.`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return new Response(
        JSON.stringify({ shouldSkip: true, reason: "No response", questions: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(content);
    
    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in clarify query:", error);
    return new Response(
      JSON.stringify({ shouldSkip: true, reason: "Error occurred", questions: [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
