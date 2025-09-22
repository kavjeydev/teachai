import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Model multipliers for credit calculation (GPT-4o-mini as 1x baseline)
const MODEL_MULTIPLIERS: Record<string, number> = {
  // OpenAI Models
  'gpt-4o-mini': 1,         // Baseline: 1 credit = 1000 tokens
  'gpt-3.5-turbo': 0.7,     // 0.7x of 4o-mini
  'gpt-4': 18,              // 18x more expensive than 4o-mini
  'gpt-4-turbo': 12,        // 12x more expensive than 4o-mini
  'gpt-4o': 15,             // 15x more expensive than 4o-mini

  // Anthropic Claude Models
  'claude-3-haiku': 1,      // Similar to 4o-mini
  'claude-3-sonnet': 8,     // 8x more expensive than 4o-mini
  'claude-3-opus': 20,      // 20x more expensive than 4o-mini
  'claude-3.5-sonnet': 10,  // 10x more expensive than 4o-mini

  // Google Gemini Models
  'gemini-pro': 3,          // 3x more expensive than 4o-mini
  'gemini-ultra': 12,       // 12x more expensive than 4o-mini
  'gemini-1.5-pro': 4,      // 4x more expensive than 4o-mini

  // Open Source Models (cheaper)
  'llama-3': 0.5,           // 0.5x cheaper than 4o-mini
  'llama-3.1': 0.6,         // 0.6x of 4o-mini
  'mistral-7b': 0.5,        // 0.5x cheaper than 4o-mini
  'mixtral-8x7b': 0.8,      // 0.8x of 4o-mini
};

export function useCreditConsumption() {
  const consumeCredits = useMutation(api.subscriptions.consumeCredits);
  const getUserCredits = useQuery(api.subscriptions.getUserCredits);

  const calculateCreditsFromTokens = (actualTokens: number, model: string): number => {
    const multiplier = MODEL_MULTIPLIERS[model] || 1;
    // Precise calculation: 1 credit = 1000 tokens for base model
    return (actualTokens / 1000) * multiplier;
  };

  const calculateCreditsNeeded = (question: string, model: string, maxTokens: number) => {
    const multiplier = MODEL_MULTIPLIERS[model] || 1;
    const estimatedTokens = Math.ceil(question.length / 4) + maxTokens; // Rough estimate for pre-check
    return Math.ceil((estimatedTokens / 1000) * multiplier);
  };

  const checkSufficientCredits = (question: string, model: string, maxTokens: number) => {
    if (!getUserCredits) return { sufficient: true, needed: 0, available: 0 };

    const needed = calculateCreditsNeeded(question, model, maxTokens);
    const available = getUserCredits.remainingCredits || 0;

    return {
      sufficient: available >= needed,
      needed,
      available,
    };
  };

  const consumeCreditsForResponse = async (
    question: string,
    response: string,
    model: string,
    chatId?: Id<"chats">
  ) => {
    try {
      // More accurate token counting
      const questionTokens = Math.ceil(question.length / 4);
      const responseTokens = Math.ceil(response.length / 4);
      const totalTokens = questionTokens + responseTokens;

      // Precise credit calculation (using actual tokens, not max tokens)
      const creditsUsed = calculateCreditsFromTokens(totalTokens, model);

      await consumeCredits({
        credits: creditsUsed,
        model: model,
        tokensUsed: totalTokens,
        chatId: chatId,
        description: `AI chat response using ${model}`,
      });

      return {
        creditsUsed,
        tokensUsed: totalTokens,
        model,
      };
    } catch (error) {
      console.error("Failed to consume credits:", error);
      throw error;
    }
  };

  return {
    calculateCreditsNeeded,
    calculateCreditsFromTokens,
    checkSufficientCredits,
    consumeCreditsForResponse,
    currentCredits: getUserCredits,
  };
}
