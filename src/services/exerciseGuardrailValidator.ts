import type { ExercisePlanRequest, ExercisePlanResponse } from "../schemas/exercisePlan";

export type GuardrailIssue = {
  level: "warning" | "error";
  code: string;
  message: string;
};

export type GuardrailValidationResult = {
  is_valid: boolean;
  issues: GuardrailIssue[];
};

function hasExercise(plan: ExercisePlanResponse, keyword: string): boolean {
  const normalized = keyword.toLowerCase();

  return plan.main_exercises.some((exercise) =>
    exercise.name.toLowerCase().includes(normalized)
  );
}

function totalMainExerciseCount(plan: ExercisePlanResponse): number {
  return plan.main_exercises.length;
}

export function validateExercisePlanSafety(
  request: ExercisePlanRequest,
  plan: ExercisePlanResponse
): GuardrailValidationResult {
  const issues: GuardrailIssue[] = [];

  const painPoints = request.pain_points.map((p) => p.toLowerCase());
  const level = request.user_info.fitness_level;
  const location = request.location;
  const equipment = request.available_equipment.map((e) => e.toLowerCase());
  const excludes = request.excluded_exercises.map((e) => e.toLowerCase());

  const hasKneePain = painPoints.includes("knee");
  const hasBackPain = painPoints.includes("back");
  const hasShoulderPain = painPoints.includes("shoulder");

  // 1) 무릎 통증 + 위험 운동
  if (hasKneePain) {
    if (hasExercise(plan, "jump") || hasExercise(plan, "burpee")) {
      issues.push({
        level: "error",
        code: "KNEE_HIGH_IMPACT",
        message: "무릎 통증이 있는데 점프성 또는 고충격 운동이 포함되어 있습니다."
      });
    }
  }

  // 2) 허리 통증 + 허리 부담 운동
  if (hasBackPain) {
    if (hasExercise(plan, "deadlift") || hasExercise(plan, "good morning")) {
      issues.push({
        level: "error",
        code: "BACK_HEAVY_HINGE",
        message: "허리 통증이 있는데 허리 부담이 큰 힙힌지 운동이 포함되어 있습니다."
      });
    }
  }

  // 3) 어깨 통증 + 오버헤드 계열
  if (hasShoulderPain) {
    if (hasExercise(plan, "shoulder press") || hasExercise(plan, "overhead")) {
      issues.push({
        level: "error",
        code: "SHOULDER_OVERHEAD",
        message: "어깨 통증이 있는데 오버헤드 계열 운동이 포함되어 있습니다."
      });
    }
  }

  // 4) 제외 운동 포함 여부
  for (const excluded of excludes) {
    if (excluded && hasExercise(plan, excluded)) {
      issues.push({
        level: "error",
        code: "EXCLUDED_EXERCISE_INCLUDED",
        message: `사용자가 제외 요청한 운동(${excluded})이 포함되어 있습니다.`
      });
    }
  }

  // 5) 집 운동인데 머신 운동 포함 여부
  if (location === "home") {
    const machineKeywords = ["leg press", "lat pulldown", "cable", "chest press"];
    const hasMachineExercise = machineKeywords.some((keyword) => hasExercise(plan, keyword));

    if (hasMachineExercise) {
      issues.push({
        level: "error",
        code: "HOME_MACHINE_MISMATCH",
        message: "집 운동인데 헬스장 머신 기반 운동이 포함되어 있습니다."
      });
    }
  }

  // 6) 덤벨이 필요한데 장비 없음
  const usesDumbbell = hasExercise(plan, "dumbbell");
  const hasDumbbell = equipment.includes("dumbbell");

  if (location === "home" && usesDumbbell && !hasDumbbell) {
    issues.push({
      level: "warning",
      code: "MISSING_DUMBBELL",
      message: "덤벨 운동이 포함되어 있지만 보유 장비 목록에 덤벨이 없습니다."
    });
  }

  // 7) 초보자에게 과도한 구성
  if (level === "beginner") {
    if (plan.total_duration_minutes > 60) {
      issues.push({
        level: "warning",
        code: "BEGINNER_TOO_LONG",
        message: "초보자에게 총 운동 시간이 다소 길 수 있습니다."
      });
    }

    if (totalMainExerciseCount(plan) > 6) {
      issues.push({
        level: "warning",
        code: "BEGINNER_TOO_MANY_EXERCISES",
        message: "초보자에게 메인 운동 수가 많을 수 있습니다."
      });
    }
  }

  // 8) 목표 불일치 경고
  if (request.goal === "weight_loss") {
    const hasCardioLike = plan.main_exercises.some(
      (e) =>
        (e.duration_minutes ?? 0) >= 8 ||
        e.name.toLowerCase().includes("walking") ||
        e.name.toLowerCase().includes("march")
    );

    if (!hasCardioLike) {
      issues.push({
        level: "warning",
        code: "WEIGHT_LOSS_LOW_CARDIO",
        message: "체중 감량 목표인데 유산소 비중이 부족할 수 있습니다."
      });
    }
  }

  return {
    is_valid: issues.every((issue) => issue.level !== "error"),
    issues
  };
}