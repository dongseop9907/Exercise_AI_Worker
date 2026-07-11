
import { z } from "zod";

export const FitnessLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export const GoalSchema = z.enum([
  "weight_loss",
  "muscle_gain",
  "endurance",
  "posture_correction",
  "rehabilitation"
]);
export const LocationSchema = z.enum(["home", "gym", "outdoor"]);

export const ExercisePlanRequestSchema = z.object({
  user_info: z.object({
    age: z.number().int().min(1).max(120),
    gender: z.string().min(1),
    height_cm: z.number().positive(),
    weight_kg: z.number().positive(),
    fitness_level: FitnessLevelSchema
  }),
  goal: GoalSchema,
  health_conditions: z.array(z.string()).default([]),
  pain_points: z.array(z.string()).default([]),
  available_days_per_week: z.number().int().min(1).max(7),
  session_minutes: z.number().int().min(10).max(180),
  location: LocationSchema,
  available_equipment: z.array(z.string()).default([]),
  preferred_exercises: z.array(z.string()).default([]),
  excluded_exercises: z.array(z.string()).default([]),
  user_requests: z.array(z.string()).default([]),
  target_date: z.string().min(1),
  natural_language_request: z.string().optional(),
  use_ai: z.boolean().optional().default(false),
  ai_provider: z.enum(["mock", "openai", "cloudflare", "gemini"]).optional().default("mock"),
  force_unsafe_ai: z.boolean().optional().default(false),
  user_id: z.string().optional(), // UUID면 .uuid() 가능
  onboarding_id: z.string().optional(),
  save_to_supabase: z.boolean().optional().default(false),
});

export type ExercisePlanRequest = z.infer<typeof ExercisePlanRequestSchema>;

export type ExerciseItem = {
  name: string;
  category: "warmup" | "main" | "cooldown";
  duration_minutes?: number;
  sets?: number;
  reps?: string;
  reason: string;
};

export type ExercisePlanResponse = {
  success: boolean;
  plan_name: string;
  goal: string;
  fitness_level: string;
  total_duration_minutes: number;
  weekly_frequency: number;
  precautions: string[];
  warmup: ExerciseItem[];
  main_exercises: ExerciseItem[];
  cooldown: ExerciseItem[];
  summary: string;
  parsed_constraints?: Record<string, unknown>;
  ai_prompt_preview?: string;
  generation_mode?: "rule_based" | "ai";
  selection_reason?: string;
  ai_provider?: "mock" | "openai" | "cloudflare" | "gemini";
  guardrail?: {
    is_valid: boolean;
    issues: {
      level: "warning" | "error";
      code: string;
      message: string;
    }[];
  };
};