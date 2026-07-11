import type { Env } from "../types";
import { selectSaferExercisePlan } from "../services/exercisePlanSelector";
import { generateExercisePlanWithAI } from "../services/exercisePlanAIService";
import { buildExercisePlanPrompt } from "../prompts/exercisePlanPrompt";
import type {
  ExercisePlanRequest,
  ExercisePlanResponse,
  ExerciseItem
} from "../schemas/exercisePlan";
import { parseExerciseConstraintsFromText } from "../parsers/exerciseConstraintParser";
import { validateExercisePlanSafety } from "../services/exerciseGuardrailValidator";

function mergeRequestWithParsedConstraints(
  request: ExercisePlanRequest
): ExercisePlanRequest {
  const parsed = parseExerciseConstraintsFromText(request.natural_language_request);

  return {
    ...request,
    goal: parsed.goal_hint ?? request.goal,
    session_minutes: parsed.session_minutes ?? request.session_minutes,
    location: parsed.location ?? request.location,
    pain_points: Array.from(
      new Set([...(request.pain_points ?? []), ...(parsed.pain_points ?? [])])
    ),
    preferred_exercises: Array.from(
      new Set([
        ...(request.preferred_exercises ?? []),
        ...(parsed.preferred_exercises ?? [])
      ])
    ),
    excluded_exercises: Array.from(
      new Set([
        ...(request.excluded_exercises ?? []),
        ...(parsed.excluded_exercises ?? [])
      ])
    ),
    user_requests: Array.from(
      new Set([...(request.user_requests ?? []), ...(parsed.user_requests ?? [])])
    ),
    user_info: {
      ...request.user_info,
      fitness_level: parsed.fitness_level_hint ?? request.user_info.fitness_level
    }
  };
}

function buildWarmup(request: ExercisePlanRequest): ExerciseItem[] {
  const warmup: ExerciseItem[] = [
    {
      name: "Neck and shoulder mobility",
      category: "warmup",
      duration_minutes: 2,
      reason: "몸을 천천히 풀어서 운동 준비를 합니다."
    },
    {
      name: "Arm circles",
      category: "warmup",
      duration_minutes: 2,
      reason: "상체 관절을 부드럽게 움직여 부상 위험을 줄입니다."
    },
    {
      name: "March in place",
      category: "warmup",
      duration_minutes: 3,
      reason: "심박수를 가볍게 올려 운동에 들어가기 좋게 만듭니다."
    }
  ];

  if (request.pain_points.some((p) => p.toLowerCase().includes("knee"))) {
    return warmup.map((item) =>
      item.name === "March in place"
        ? {
            ...item,
            name: "Slow march in place",
            reason: "무릎 부담을 줄인 저충격 준비운동입니다."
          }
        : item
    );
  }

  return warmup;
}

function buildMainExercises(request: ExercisePlanRequest): ExerciseItem[] {
  const isBeginner = request.user_info.fitness_level === "beginner";
  const isHome = request.location === "home";
  const hasKneePain = request.pain_points.some((p) => p.toLowerCase().includes("knee"));
  const hasBackPain = request.pain_points.some((p) => p.toLowerCase().includes("back"));
  const prefersWalking = request.preferred_exercises.some((e) =>
    e.toLowerCase().includes("walking")
  );
  const excludesJump = request.excluded_exercises.some((e) =>
    e.toLowerCase().includes("jump")
  );

  if (request.goal === "weight_loss") {
    const exercises: ExerciseItem[] = [
      {
        name: "Bodyweight squat",
        category: "main",
        sets: isBeginner ? 2 : 3,
        reps: isBeginner ? "10회" : "15회",
        reason: "체중 감량에 도움이 되는 전신 운동입니다."
      },
      {
        name: "Push-up",
        category: "main",
        sets: isBeginner ? 2 : 3,
        reps: isBeginner ? "무릎대고 8회" : "12회",
        reason: "상체 근력 향상과 칼로리 소모에 도움이 됩니다."
      },
      {
        name: "Plank",
        category: "main",
        sets: 3,
        reps: isBeginner ? "20초" : "40초",
        reason: "코어를 강화해서 전체 운동 효율을 높입니다."
      },
      {
        name: prefersWalking ? "Walking routine" : "Fast walking or indoor marching",
        category: "main",
        duration_minutes: isBeginner ? 8 : 12,
        reason: "유산소 운동으로 체지방 감량에 도움이 됩니다."
      }
    ];

    return exercises
      .filter((exercise) => {
        if (hasKneePain && exercise.name === "Bodyweight squat") return false;
        if (excludesJump && exercise.name.toLowerCase().includes("jump")) return false;
        return true;
      })
      .map((exercise) => {
        if (hasKneePain && exercise.name === "Fast walking or indoor marching") {
          return {
            ...exercise,
            name: "Low-impact indoor walking",
            reason: "무릎 충격을 줄인 저강도 유산소 운동입니다."
          };
        }
        if (hasBackPain && exercise.name === "Bodyweight squat") {
          return {
            ...exercise,
            name: "Chair sit-to-stand",
            reason: "허리 부담을 줄이면서 하체를 자극할 수 있습니다."
          };
        }
        return exercise;
      });
  }

  if (request.goal === "muscle_gain") {
    if (isHome) {
      return [
        {
          name: "Dumbbell goblet squat",
          category: "main",
          sets: isBeginner ? 3 : 4,
          reps: "10~12회",
          reason: "하체 근육량 증가에 도움이 됩니다."
        },
        {
          name: "Dumbbell row",
          category: "main",
          sets: isBeginner ? 3 : 4,
          reps: "10~12회",
          reason: "등 근육 발달에 도움이 됩니다."
        },
        {
          name: "Push-up",
          category: "main",
          sets: isBeginner ? 3 : 4,
          reps: "8~12회",
          reason: "가슴과 팔 근력 강화에 적합합니다."
        },
        {
          name: "Glute bridge",
          category: "main",
          sets: 3,
          reps: "15회",
          reason: "둔근과 코어를 안정적으로 강화합니다."
        }
      ];
    }

    return [
      {
        name: "Leg press",
        category: "main",
        sets: isBeginner ? 3 : 4,
        reps: "10~12회",
        reason: "하체 근비대에 적합한 머신 운동입니다."
      },
      {
        name: "Lat pulldown",
        category: "main",
        sets: isBeginner ? 3 : 4,
        reps: "10~12회",
        reason: "등 근육 발달에 효과적입니다."
      },
      {
        name: "Chest press",
        category: "main",
        sets: isBeginner ? 3 : 4,
        reps: "10~12회",
        reason: "가슴 근육과 상체 힘 향상에 좋습니다."
      },
      {
        name: "Seated cable row",
        category: "main",
        sets: 3,
        reps: "12회",
        reason: "상체 후면 근육 균형에 도움이 됩니다."
      }
    ];
  }

  if (request.goal === "posture_correction" || request.goal === "rehabilitation") {
    return [
      {
        name: "Bird-dog",
        category: "main",
        sets: 3,
        reps: "10회",
        reason: "척추 안정화와 자세 교정에 좋습니다."
      },
      {
        name: "Dead bug",
        category: "main",
        sets: 3,
        reps: "10회",
        reason: "코어 안정성 향상에 적합합니다."
      },
      {
        name: "Glute bridge",
        category: "main",
        sets: 3,
        reps: "12회",
        reason: "골반 안정성과 둔근 강화에 도움이 됩니다."
      },
      {
        name: "Band pull-apart",
        category: "main",
        sets: 3,
        reps: "15회",
        reason: "굽은 어깨와 상체 정렬 개선에 도움이 됩니다."
      }
    ];
  }

  return [
    {
      name: "Brisk walking",
      category: "main",
      duration_minutes: 15,
      reason: "심폐지구력 향상에 적합한 유산소 운동입니다."
    },
    {
      name: "Step-up",
      category: "main",
      sets: 3,
      reps: "12회",
      reason: "하체 지구력 향상에 도움이 됩니다."
    },
    {
      name: "Mountain climber",
      category: "main",
      sets: 3,
      reps: "20초",
      reason: "전신 지구력과 코어 활성화에 적합합니다."
    }
  ];
}

function buildCooldown(): ExerciseItem[] {
  return [
    {
      name: "Hamstring stretch",
      category: "cooldown",
      duration_minutes: 2,
      reason: "하체 긴장을 완화합니다."
    },
    {
      name: "Chest stretch",
      category: "cooldown",
      duration_minutes: 2,
      reason: "상체 긴장을 풀고 자세 회복에 도움이 됩니다."
    },
    {
      name: "Deep breathing",
      category: "cooldown",
      duration_minutes: 2,
      reason: "심박수를 안정시키고 마무리합니다."
    }
  ];
}

function calculateTotalDuration(
  warmup: ExerciseItem[],
  main: ExerciseItem[],
  cooldown: ExerciseItem[],
  request: ExercisePlanRequest
): number {
  const warmupMinutes = warmup.reduce((sum, item) => sum + (item.duration_minutes ?? 0), 0);
  const cooldownMinutes = cooldown.reduce((sum, item) => sum + (item.duration_minutes ?? 0), 0);

  const mainEstimatedMinutes = main.reduce((sum, item) => {
    if (item.duration_minutes) return sum + item.duration_minutes;
    const sets = item.sets ?? 3;
    return sum + sets * 2;
  }, 0);

  return Math.min(warmupMinutes + mainEstimatedMinutes + cooldownMinutes, request.session_minutes);
}

function buildPrecautions(request: ExercisePlanRequest): string[] {
  const precautions: string[] = [];

  if (request.pain_points.length > 0) {
    precautions.push(`통증 부위(${request.pain_points.join(", ")})에 무리가 가는 동작은 피하세요.`);
  }

  if (request.health_conditions.length > 0) {
    precautions.push(`건강 상태(${request.health_conditions.join(", ")})를 고려하여 강도를 조절하세요.`);
  }

  if (request.user_info.fitness_level === "beginner") {
    precautions.push("초보자는 정확한 자세를 우선하고, 무리해서 횟수를 늘리지 마세요.");
  }

  precautions.push("운동 중 통증이 심해지면 즉시 중단하세요.");

  return precautions;
}

export async function runExercisePlanWorkflow(
  request: ExercisePlanRequest,
  env?: Env
): Promise<ExercisePlanResponse> {
  const resolvedRequest = mergeRequestWithParsedConstraints(request);
  const parsedConstraints = parseExerciseConstraintsFromText(
    request.natural_language_request
  );

  const prompt = buildExercisePlanPrompt(resolvedRequest);

  // -------------------------
  // Rule-based 생성
  // -------------------------
  const ruleWarmup = buildWarmup(resolvedRequest);
  const ruleMain = buildMainExercises(resolvedRequest);
  const ruleCooldown = buildCooldown();
  const rulePrecautions = buildPrecautions(resolvedRequest);
  const ruleTotalDuration = calculateTotalDuration(
    ruleWarmup,
    ruleMain,
    ruleCooldown,
    resolvedRequest
  );

  const rulePlan: ExercisePlanResponse = {
    success: true,
    plan_name: `${resolvedRequest.goal}_plan_${resolvedRequest.location}`,
    goal: resolvedRequest.goal,
    fitness_level: resolvedRequest.user_info.fitness_level,
    total_duration_minutes: ruleTotalDuration,
    weekly_frequency: resolvedRequest.available_days_per_week,
    precautions: rulePrecautions,
    warmup: ruleWarmup,
    main_exercises: ruleMain,
    cooldown: ruleCooldown,
    summary:
      "사용자의 목표, 운동 수준, 통증 부위, 운동 장소를 기준으로 기본 운동 루틴을 생성했습니다.",
    parsed_constraints: parsedConstraints,
    ai_prompt_preview: prompt,
    generation_mode: "rule_based",
    ai_provider: resolvedRequest.use_ai ? resolvedRequest.ai_provider : undefined,
    guardrail: validateExercisePlanSafety(resolvedRequest, {
      success: true,
      plan_name: "",
      goal: resolvedRequest.goal,
      fitness_level: resolvedRequest.user_info.fitness_level,
      total_duration_minutes: ruleTotalDuration,
      weekly_frequency: resolvedRequest.available_days_per_week,
      precautions: rulePrecautions,
      warmup: ruleWarmup,
      main_exercises: ruleMain,
      cooldown: ruleCooldown,
      summary: "",
      parsed_constraints: parsedConstraints,
      ai_prompt_preview: prompt,
      generation_mode: "rule_based",
      ai_provider: resolvedRequest.ai_provider
    })
  };

  // -------------------------
  // AI 사용 안하면 바로 반환
  // -------------------------
  if (!resolvedRequest.use_ai) {
    return rulePlan;
  }

  // -------------------------
  // Gemini 호출
  // -------------------------
  const aiRaw = await generateExercisePlanWithAI({
    prompt,
    provider: resolvedRequest.ai_provider,
    env,
    forceUnsafe: resolvedRequest.force_unsafe_ai
  });

  console.log("🔥 AI RAW RESULT:", JSON.stringify(aiRaw, null, 2));

  // -------------------------
  // AI 결과 변환
  // -------------------------
  const aiWarmup = aiRaw.warmup.map((item) => ({
    ...item,
    category: "warmup" as const
  }));

  const aiMain = aiRaw.main_exercises.map((item) => ({
    ...item,
    category: "main" as const
  }));

  const aiCooldown = aiRaw.cooldown.map((item) => ({
    ...item,
    category: "cooldown" as const
  }));

  const aiTotalDuration = calculateTotalDuration(
    aiWarmup,
    aiMain,
    aiCooldown,
    resolvedRequest
  );

  const aiPlan: ExercisePlanResponse = {
    success: true,
    plan_name: aiRaw.plan_name,
    goal: resolvedRequest.goal,
    fitness_level: resolvedRequest.user_info.fitness_level,
    total_duration_minutes: aiTotalDuration,
    weekly_frequency: resolvedRequest.available_days_per_week,
    precautions: aiRaw.precautions,
    warmup: aiWarmup,
    main_exercises: aiMain,
    cooldown: aiCooldown,
    summary: aiRaw.summary,
    parsed_constraints: parsedConstraints,
    ai_prompt_preview: prompt,
    generation_mode: "ai",
    ai_provider: resolvedRequest.ai_provider,
    guardrail: validateExercisePlanSafety(resolvedRequest, {
      success: true,
      plan_name: aiRaw.plan_name,
      goal: resolvedRequest.goal,
      fitness_level: resolvedRequest.user_info.fitness_level,
      total_duration_minutes: aiTotalDuration,
      weekly_frequency: resolvedRequest.available_days_per_week,
      precautions: aiRaw.precautions,
      warmup: aiWarmup,
      main_exercises: aiMain,
      cooldown: aiCooldown,
      summary: aiRaw.summary,
      parsed_constraints: parsedConstraints,
      ai_prompt_preview: prompt,
      generation_mode: "ai",
      ai_provider: resolvedRequest.ai_provider
    })
  };

  console.log("AI GUARD:", aiPlan.guardrail);

  // -------------------------
  // 🔥 최종 선택 로직 (실전용)
  // -------------------------
  if (aiPlan.guardrail?.is_valid) {
  return aiPlan;
  }

  console.log("⚠️ AI 실패 → rule-based fallback");

  return rulePlan;   // ❌ AI 실패하면 fallback
}