import type { Context } from "hono";
import { saveWorkoutRecommendation } from "../services/saveWorkoutRecommendation";
import { ExercisePlanRequestSchema } from "../schemas/exercisePlan";
import { runExercisePlanWorkflow } from "../workflows/exercisePlanWorkflow";
import type { Env } from "../types";

export async function exercisePlanRequestHandler(c: Context<{ Bindings: Env }>) {
  try {
    const body = await c.req.json();
    const parsed = ExercisePlanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          message: "입력값 검증 실패",
          errors: parsed.error.flatten()
        },
        400
      );
    }

    console.log("🔥 ENV CHECK", {
      exists: !!c.env.GEMINI_API_KEY
    });

    const result = await runExercisePlanWorkflow(parsed.data, c.env);

    if (
      result?.success &&
      parsed.data.save_to_supabase &&
      parsed.data.user_id
    ) {
      await saveWorkoutRecommendation(c.env, {
        userId: parsed.data.user_id,
        onboardingId: parsed.data.onboarding_id ?? null,
        resultJson: result,
        modelName: result.ai_provider ?? "gemini",
        promptVersion: "v1"
      });
    }

    return c.json(result, 200);
  } catch (error) {
    console.error("exercisePlanRequestHandler error:", error);

    return c.json(
      {
        success: false,
        message: "서버 내부 오류가 발생했습니다."
      },
      500
    );
  }
}