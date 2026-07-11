export type ParsedExerciseConstraints = {
  pain_points?: string[];
  location?: "home" | "gym" | "outdoor";
  session_minutes?: number;
  fitness_level_hint?: "beginner" | "intermediate" | "advanced";
  goal_hint?:
    | "weight_loss"
    | "muscle_gain"
    | "endurance"
    | "posture_correction"
    | "rehabilitation";
  preferred_exercises?: string[];
  excluded_exercises?: string[];
  user_requests?: string[];
};

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function parseSessionMinutes(text: string): number | undefined {
  const match = text.match(/(\d+)\s*분/);
  if (!match) return undefined;

  const minutes = Number(match[1]);
  if (Number.isNaN(minutes)) return undefined;
  if (minutes < 10 || minutes > 180) return undefined;

  return minutes;
}

export function parseExerciseConstraintsFromText(
  input?: string
): ParsedExerciseConstraints {
  if (!input || !input.trim()) {
    return {};
  }

  const text = input.toLowerCase();
  const result: ParsedExerciseConstraints = {
    pain_points: [],
    preferred_exercises: [],
    excluded_exercises: [],
    user_requests: []
  };

  // 통증/부상 부위
  if (includesAny(text, ["무릎", "knee"])) {
    result.pain_points?.push("knee");
  }

  if (includesAny(text, ["허리", "back", "lower back"])) {
    result.pain_points?.push("back");
  }

  if (includesAny(text, ["어깨", "shoulder"])) {
    result.pain_points?.push("shoulder");
  }

  // 장소
  if (includesAny(text, ["집", "home", "홈트"])) {
    result.location = "home";
  } else if (includesAny(text, ["헬스장", "gym"])) {
    result.location = "gym";
  } else if (includesAny(text, ["야외", "공원", "outdoor"])) {
    result.location = "outdoor";
  }

  // 시간
  const parsedMinutes = parseSessionMinutes(text);
  if (parsedMinutes) {
    result.session_minutes = parsedMinutes;
  }

  // 운동 수준 힌트
  if (includesAny(text, ["초보", "beginner", "처음", "입문"])) {
    result.fitness_level_hint = "beginner";
    result.user_requests?.push("beginner_friendly");
  } else if (includesAny(text, ["중급", "intermediate"])) {
    result.fitness_level_hint = "intermediate";
  } else if (includesAny(text, ["고급", "advanced"])) {
    result.fitness_level_hint = "advanced";
  }

  // 목표 힌트
  if (includesAny(text, ["살 빼", "다이어트", "체중 감량", "감량", "weight loss"])) {
    result.goal_hint = "weight_loss";
  } else if (includesAny(text, ["근육", "벌크", "근성장", "muscle"])) {
    result.goal_hint = "muscle_gain";
  } else if (includesAny(text, ["체력", "지구력", "endur"])) {
    result.goal_hint = "endurance";
  } else if (includesAny(text, ["자세", "거북목", "굽은 어깨"])) {
    result.goal_hint = "posture_correction";
  } else if (includesAny(text, ["재활", "rehab"])) {
    result.goal_hint = "rehabilitation";
  }

  // 선호 운동
  if (includesAny(text, ["걷기", "walking"])) {
    result.preferred_exercises?.push("walking");
  }

  if (includesAny(text, ["코어", "plank"])) {
    result.preferred_exercises?.push("core");
  }

  if (includesAny(text, ["스트레칭", "stretch"])) {
    result.preferred_exercises?.push("stretching");
  }

  // 제외 운동
  if (includesAny(text, ["버피 제외", "burpee 제외", "버피 싫", "burpee 싫"])) {
    result.excluded_exercises?.push("burpee");
  }

  if (includesAny(text, ["점프 싫", "점프는 빼", "점프 제외"])) {
    result.excluded_exercises?.push("jump");
  }

  // 추가 요청
  if (includesAny(text, ["쉽게", "무리 없이", "가볍게"])) {
    result.user_requests?.push("easy_intensity");
  }

  if (includesAny(text, ["천천히"])) {
    result.user_requests?.push("slow_progression");
  }

  // 빈 배열 정리
  if (result.pain_points?.length === 0) delete result.pain_points;
  if (result.preferred_exercises?.length === 0) delete result.preferred_exercises;
  if (result.excluded_exercises?.length === 0) delete result.excluded_exercises;
  if (result.user_requests?.length === 0) delete result.user_requests;

  return result;
}