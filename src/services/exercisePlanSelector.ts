import type { ExercisePlanResponse } from "../schemas/exercisePlan";

function countErrors(plan: ExercisePlanResponse): number {
  return plan.guardrail?.issues.filter((issue) => issue.level === "error").length ?? 0;
}

function countWarnings(plan: ExercisePlanResponse): number {
  return plan.guardrail?.issues.filter((issue) => issue.level === "warning").length ?? 0;
}

export function selectSaferExercisePlan(
  rulePlan: ExercisePlanResponse,
  aiPlan: ExercisePlanResponse
): {
  selectedPlan: ExercisePlanResponse;
  selectionReason: string;
} {
  const ruleErrors = countErrors(rulePlan);
  const aiErrors = countErrors(aiPlan);

  const ruleWarnings = countWarnings(rulePlan);
  const aiWarnings = countWarnings(aiPlan);

  if (ruleErrors === 0 && aiErrors > 0) {
    return {
      selectedPlan: {
        ...rulePlan,
        generation_mode: "rule_based"
      },
      selectionReason: "AI 결과에 guardrail error가 있어 rule-based 결과를 선택했습니다."
    };
  }

  if (aiErrors === 0 && ruleErrors > 0) {
    return {
      selectedPlan: {
        ...aiPlan,
        generation_mode: "ai"
      },
      selectionReason: "rule-based 결과에 guardrail error가 있어 AI 결과를 선택했습니다."
    };
  }

  if (ruleErrors < aiErrors) {
    return {
      selectedPlan: {
        ...rulePlan,
        generation_mode: "rule_based"
      },
      selectionReason: "rule-based 결과의 guardrail error 수가 더 적어 선택했습니다."
    };
  }

  if (aiErrors < ruleErrors) {
    return {
      selectedPlan: {
        ...aiPlan,
        generation_mode: "ai"
      },
      selectionReason: "AI 결과의 guardrail error 수가 더 적어 선택했습니다."
    };
  }

  if (ruleWarnings < aiWarnings) {
    return {
      selectedPlan: {
        ...rulePlan,
        generation_mode: "rule_based"
      },
      selectionReason: "warning 수가 더 적은 rule-based 결과를 선택했습니다."
    };
  }

  if (aiWarnings < ruleWarnings) {
    return {
      selectedPlan: {
        ...aiPlan,
        generation_mode: "ai"
      },
      selectionReason: "warning 수가 더 적은 AI 결과를 선택했습니다."
    };
  }

  return {
    selectedPlan: {
      ...aiPlan,
      generation_mode: "ai"
    },
    selectionReason: "안전성 점수가 동일하여 AI 결과를 우선 선택했습니다."
  };
}