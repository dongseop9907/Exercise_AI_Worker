export type ExerciseRecord = {
  id: string;
  name: string;
  category: string;
  body_part: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  location: "home" | "gym" | "outdoor";
  equipment: string[];
  suitable_goals: string[];
  contraindications: string[];
  impact_level: "low" | "medium" | "high";
  default_sets?: number;
  default_reps?: string;
  default_duration_minutes?: number;
  reason_template: string;
};

export const EXERCISE_DB: ExerciseRecord[] = [
  {
    id: "1",
    name: "Push-up",
    category: "strength",
    body_part: "chest",
    difficulty: "beginner",
    location: "home",
    equipment: [],
    suitable_goals: ["weight_loss", "muscle_gain"],
    contraindications: ["shoulder_pain"],
    impact_level: "low",
    default_sets: 3,
    default_reps: "8~12회",
    reason_template: "상체 근력 향상에 도움이 됩니다."
  },
  {
    id: "2",
    name: "Plank",
    category: "strength",
    body_part: "core",
    difficulty: "beginner",
    location: "home",
    equipment: ["mat"],
    suitable_goals: ["weight_loss", "posture_correction"],
    contraindications: [],
    impact_level: "low",
    default_sets: 3,
    default_reps: "20~40초",
    reason_template: "코어를 강화해 전체 운동 효율을 높입니다."
  },
  {
    id: "3",
    name: "Bird-dog",
    category: "mobility",
    body_part: "core",
    difficulty: "beginner",
    location: "home",
    equipment: ["mat"],
    suitable_goals: ["posture_correction", "rehabilitation"],
    contraindications: [],
    impact_level: "low",
    default_sets: 3,
    default_reps: "10회",
    reason_template: "코어 안정성과 자세 유지에 도움이 됩니다."
  },
  {
    id: "4",
    name: "Low-impact walking",
    category: "cardio",
    body_part: "full_body",
    difficulty: "beginner",
    location: "home",
    equipment: [],
    suitable_goals: ["weight_loss", "endurance"],
    contraindications: [],
    impact_level: "low",
    default_duration_minutes: 8,
    reason_template: "무릎 부담을 줄이면서 유산소 운동 효과를 얻을 수 있습니다."
  },
  {
    id: "5",
    name: "Burpee",
    category: "cardio",
    body_part: "full_body",
    difficulty: "advanced",
    location: "home",
    equipment: [],
    suitable_goals: ["weight_loss"],
    contraindications: ["knee_pain", "back_pain"],
    impact_level: "high",
    default_sets: 3,
    default_reps: "12회",
    reason_template: "고강도 전신 운동입니다."
  }
];

export function getAllExercises(): ExerciseRecord[] {
  return EXERCISE_DB;
}