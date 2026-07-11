import type { ExercisePlanRequest } from "../schemas/exercisePlan";
import type { ExerciseRecord } from "../data/exerciseRepository";

export function scoreExercise(
  request: ExercisePlanRequest,
  exercise: ExerciseRecord
): number {
  let score = 0;

  if (exercise.suitable_goals.includes(request.goal)) score += 30;
  if (exercise.difficulty === request.user_info.fitness_level) score += 20;
  if (exercise.location === request.location) score += 15;

  const hasAllEquipment = exercise.equipment.every(
    (item) => request.available_equipment.includes(item) || item === "mat"
  );
  if (hasAllEquipment) score += 10;

  if (request.preferred_exercises.some((p) => exercise.name.toLowerCase().includes(p.toLowerCase()))) {
    score += 15;
  }

  const painTags = request.pain_points.map((p) => `${p}_pain`);
  if (exercise.contraindications.some((c) => painTags.includes(c))) {
    score -= 100;
  }

  if (request.excluded_exercises.some((e) => exercise.name.toLowerCase().includes(e.toLowerCase()))) {
    score -= 100;
  }

  return score;
}