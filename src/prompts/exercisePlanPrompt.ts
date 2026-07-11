import type { ExercisePlanRequest } from "../schemas/exercisePlan";
import { parseExerciseConstraintsFromText } from "../parsers/exerciseConstraintParser";

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "없음";
}

export function buildExercisePlanPrompt(request: ExercisePlanRequest): string {
  const parsed = parseExerciseConstraintsFromText(request.natural_language_request);

  return `
당신은 개인 맞춤형 운동 추천 전문가입니다.
사용자의 건강 상태, 운동 목표, 통증 부위, 운동 가능 환경을 고려해서
안전하고 현실적인 1회 운동 루틴을 추천하세요.

[사용자 기본 정보]
- 나이: ${request.user_info.age}
- 성별: ${request.user_info.gender}
- 키(cm): ${request.user_info.height_cm}
- 몸무게(kg): ${request.user_info.weight_kg}
- 운동 수준: ${request.user_info.fitness_level}

[운동 목표]
- 목표: ${request.goal}

[건강 및 통증 정보]
- 건강 상태: ${formatList(request.health_conditions)}
- 통증 부위: ${formatList(request.pain_points)}

[운동 환경]
- 주당 운동 가능 횟수: ${request.available_days_per_week}회
- 1회 운동 가능 시간: ${request.session_minutes}분
- 운동 장소: ${request.location}
- 보유 장비: ${formatList(request.available_equipment)}

[선호 / 제외]
- 선호 운동: ${formatList(request.preferred_exercises)}
- 제외 운동: ${formatList(request.excluded_exercises)}
- 추가 요청: ${formatList(request.user_requests)}

[사용자 자연어 요청]
- ${request.natural_language_request ?? "없음"}

[자연어 요청 해석 결과]
- goal_hint: ${parsed.goal_hint ?? "없음"}
- pain_points: ${formatList(parsed.pain_points ?? [])}
- location: ${parsed.location ?? "없음"}
- session_minutes: ${parsed.session_minutes ?? "없음"}
- fitness_level_hint: ${parsed.fitness_level_hint ?? "없음"}
- preferred_exercises: ${formatList(parsed.preferred_exercises ?? [])}
- excluded_exercises: ${formatList(parsed.excluded_exercises ?? [])}
- user_requests: ${formatList(parsed.user_requests ?? [])}

[중요 안전 규칙]
1. 무릎 통증이 있으면 점프, 버피, 고충격 운동을 피하세요.
2. 허리 통증이 있으면 허리 부담이 큰 운동을 피하세요.
3. 어깨 통증이 있으면 오버헤드 계열 운동을 피하세요.
4. 운동 장소와 보유 장비에 맞는 운동만 추천하세요.
5. 초보자라면 강도를 과하게 높이지 마세요.
6. 총 운동 시간은 가능한 한 사용자의 제한 시간 안에 맞추세요.

[출력 요구사항]
다음 JSON 형식으로만 응답하세요.

{
  "plan_name": "string",
  "summary": "string",
  "precautions": ["string"],
  "warmup": [
    {
      "name": "string",
      "duration_minutes": number,
      "reason": "string"
    }
  ],
  "main_exercises": [
    {
      "name": "string",
      "sets": number,
      "reps": "string",
      "reason": "string"
    },
    {
      "name": "string",
      "duration_minutes": number,
      "reason": "string"
    }
  ],
  "cooldown": [
    {
      "name": "string",
      "duration_minutes": number,
      "reason": "string"
    }
  ]
}

[중요 규칙]

- 근력 운동:
  → sets + reps 반드시 포함
  → duration_minutes 사용 금지

- 유산소 운동:
  → duration_minutes 반드시 포함
  → sets, reps 사용 금지

- 하나의 운동은 반드시 위 두 가지 중 하나만 선택

- 모든 main_exercises는 반드시 아래 중 하나를 만족해야 합니다:
  1. sets + reps 존재
  2. duration_minutes 존재

- JSON 형식은 절대 깨지면 안 됩니다.

[예시]

"main_exercises": [
  {
    "name": "Push-up",
    "sets": 3,
    "reps": "10회",
    "reason": "상체 강화"
  },
  {
    "name": "Fast walking",
    "duration_minutes": 10,
    "reason": "유산소 운동"
  }
]

반드시 안전하고 현실적인 추천만 하세요.
`.trim();
}