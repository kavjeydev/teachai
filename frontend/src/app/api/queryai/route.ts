import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const convexUrl =
    "https://agile-ermine-199.convex.cloud/api/run/chats/getChatByIdExposed";

  const { question, chatId } = await req.json();

  if (!question || !chatId) {
    return NextResponse.json(
      { error: "Missing question or chatId" },
      { status: 400 },
    );
  }

  const currentChatRequest = {
    args: { id: chatId },
    format: "json",
  };

  const currentChatresponse = await fetch(convexUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(currentChatRequest),
  });

  const currentChat = await currentChatresponse.json();

  const chatAPIKey = currentChat.value?.apiKey;
  const chatProtected = currentChat.value?.apiKeyDisabled;
  const chatArchived = currentChat.value?.isArchived;

  if (chatProtected) {
    return NextResponse.json(
      {
        error:
          "Chat is protected, if you are the owner, make it public in the API settings to access this endpoint.",
      },
      { status: 401 },
    );
  }

  if (chatArchived) {
    return NextResponse.json(
      {
        error: "Chat is archived, restore the chat for API access.",
      },
      { status: 401 },
    );
  }

  if (!currentChat) {
    return NextResponse.json({ error: "Not a valid chat ID" }, { status: 401 });
  }

  if (!apiKey || apiKey !== chatAPIKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(process.env.NEXT_PUBLIC_BASE_URL as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYPERMODE_API_KEY}`,
    },
    body: JSON.stringify({
      query: `
            query($question: String!, $chatId: String!) {
              answerQuestion(question: $question, chatId: $chatId) {
                answer
                context {
                  chunkId
                  chunkText
                  score
                }
              }
            }
          `,
      variables: { question, chatId },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();

  return NextResponse.json(
    {
      answer: result.data.answerQuestion.answer,
    },
    { status: 200 },
  );
}
