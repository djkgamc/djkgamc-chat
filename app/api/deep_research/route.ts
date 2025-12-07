import OpenAI from "openai";

const DEEP_RESEARCH_MODEL = "o4-mini-deep-research-2025-06-26";

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

    const response = await openai.responses.create({
      model: DEEP_RESEARCH_MODEL,
      input: [
        {
          role: "user",
          content: query,
        },
      ],
      tools: [
        { type: "web_search_preview" },
      ],
    } as any);

    const responseId = response.id;

    let result: any = response;
    let attempts = 0;
    const maxAttempts = 120;

    while (result.status !== "completed" && result.status !== "failed" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      result = await openai.responses.retrieve(responseId);
      attempts++;
    }

    if (result.status === "failed") {
      return new Response(
        JSON.stringify({ error: "Deep research failed" }),
        { status: 500 }
      );
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ error: "Deep research timed out" }),
        { status: 504 }
      );
    }

    let reportText = "";
    const annotations: any[] = [];
    
    for (const item of result.output || []) {
      if (item.type === "message" && item.content) {
        for (const content of item.content) {
          if (content.type === "output_text") {
            reportText += content.text;
            if (content.annotations) {
              annotations.push(...content.annotations);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        report: reportText,
        annotations,
        responseId,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in deep research:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
