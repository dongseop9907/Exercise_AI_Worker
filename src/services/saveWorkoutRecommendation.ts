import type { Env } from "../types";
import { createSupabaseAdmin } from "./supabaseRecommendationStore";

type SaveRecommendationInput = {
  userId: string;
  onboardingId?: string | null;
  resultJson: unknown;
  modelName?: string;
  promptVersion?: string;
};

export async function saveWorkoutRecommendation(
  env: Env,
  input: SaveRecommendationInput
) {
  const supabaseAdmin = createSupabaseAdmin(env);

  const { data, error } = await supabaseAdmin
    .from("ai_recommendations")
    .insert({
      user_id: input.userId,
      onboarding_id: input.onboardingId ?? null,
      recommendation_type: "workout_plan",
      status: "completed",
      model_name: input.modelName ?? "gemini",
      prompt_version: input.promptVersion ?? "v1",
      result_json: input.resultJson,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}