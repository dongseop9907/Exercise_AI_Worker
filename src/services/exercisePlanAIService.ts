import type { Env } from "../types";

export type AIExerciseItem = {
  name: string;
  duration_minutes?: number;
  sets?: number;
  reps?: string;
  reason: string;
};

export type AIExercisePlanResult = {
  plan_name: string;
  summary: string;
  precautions: string[];
  warmup: AIExerciseItem[];
  main_exercises: AIExerciseItem[];
  cooldown: AIExerciseItem[];
};

export type AIProvider = "mock" | "openai" | "cloudflare" | "gemini";

type GenerateExercisePlanParams = {
  prompt: string;
  provider: AIProvider;
  env?: Env;
  forceUnsafe?: boolean;
};

function extractJsonFromText(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 응답에서 JSON을 찾을 수 없습니다.");
  }

  return text.slice(start, end + 1);
}

function validateAIResultShape(data: any): AIExercisePlanResult {
  if (
    !data ||
    typeof data.plan_name !== "string" ||
    typeof data.summary !== "string" ||
    !Array.isArray(data.precautions) ||
    !Array.isArray(data.warmup) ||
    !Array.isArray(data.main_exercises) ||
    !Array.isArray(data.cooldown)
  ) {
    throw new Error("AI 응답 JSON 구조가 올바르지 않습니다.");
  }

  return data as AIExercisePlanResult;
}

async function generateWithMock(
  prompt: string,
  forceUnsafe?: boolean
): Promise<AIExercisePlanResult> {
  console.log("MOCK AI Prompt:", prompt);

  if (forceUnsafe) {
    return {
      plan_name: "ai_generated_unsafe_exercise_plan",
      summary: "AI가 생성했지만 일부 위험 요소가 포함된 테스트용 운동 루틴입니다.",
      precautions: [
        "고강도 운동 전 충분한 준비가 필요합니다."
      ],
      warmup: [
        {
          name: "Quick warmup",
          duration_minutes: 2,
          reason: "짧은 준비운동입니다."
        }
      ],
      main_exercises: [
        {
          name: "Burpee",
          sets: 3,
          reps: "15회",
          reason: "고강도 전신 운동입니다."
        },
        {
          name: "Jump squat",
          sets: 3,
          reps: "12회",
          reason: "폭발적인 점프 하체 운동입니다."
        },
        {
          name: "High-impact running in place",
          duration_minutes: 8,
          reason: "고충격 유산소 운동입니다."
        }
      ],
      cooldown: [
        {
          name: "Short breathing",
          duration_minutes: 1,
          reason: "간단한 마무리입니다."
        }
      ]
    };
  }

  return {
    plan_name: "ai_generated_exercise_plan",
    summary: "AI가 사용자 조건을 바탕으로 생성한 운동 루틴입니다.",
    precautions: [
      "통증 부위에 무리가 가는 동작은 피하세요.",
      "운동 중 통증이 심해지면 즉시 중단하세요."
    ],
    warmup: [
      {
        name: "Dynamic shoulder mobility",
        duration_minutes: 2,
        reason: "상체를 부드럽게 풀어 운동 준비를 합니다."
      },
      {
        name: "Light march",
        duration_minutes: 3,
        reason: "심박수를 천천히 올립니다."
      }
    ],
    main_exercises: [
      {
        name: "Wall push-up",
        sets: 3,
        reps: "10회",
        reason: "초보자도 안전하게 수행할 수 있는 상체 운동입니다."
      },
      {
        name: "Bird-dog",
        sets: 3,
        reps: "10회",
        reason: "코어 안정성과 자세 유지에 도움이 됩니다."
      },
      {
        name: "Low-impact walking",
        duration_minutes: 8,
        reason: "무릎 부담을 줄이면서 유산소 운동 효과를 얻을 수 있습니다."
      }
    ],
    cooldown: [
      {
        name: "Hamstring stretch",
        duration_minutes: 2,
        reason: "하체 긴장을 부드럽게 완화합니다."
      },
      {
        name: "Breathing cooldown",
        duration_minutes: 2,
        reason: "심박수를 안정시키고 마무리합니다."
      }
    ]
  };
}

async function generateWithOpenAI(
  prompt: string,
  env?: Env
): Promise<AIExercisePlanResult> {
  if (!env?.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "너는 개인 맞춤형 운동 추천 AI다. 반드시 JSON만 반환하고, 안전한 운동만 추천해야 한다."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI 호출 실패: ${response.status} ${errorText}`);
  }

  const json: any = await response.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("OpenAI 응답에서 content를 찾을 수 없습니다.");
  }

  const parsed = JSON.parse(extractJsonFromText(content));
  return validateAIResultShape(parsed);
}

async function generateWithCloudflare(
  prompt: string,
  env?: Env
): Promise<AIExercisePlanResult> {
  if (!env?.CLOUDFLARE_ACCOUNT_ID || !env?.CLOUDFLARE_API_TOKEN) {
    throw new Error("Cloudflare AI 환경변수가 설정되지 않았습니다.");
  }

  const model = env.CLOUDFLARE_AI_MODEL ?? "@cf/meta/llama-3.1-8b-instruct";
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            "너는 개인 맞춤형 운동 추천 AI다. 반드시 JSON만 반환하고, 안전한 운동만 추천해야 한다."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare AI 호출 실패: ${response.status} ${errorText}`);
  }

  const json: any = await response.json();
  const content = json.result?.response;

  if (!content || typeof content !== "string") {
    throw new Error("Cloudflare AI 응답에서 response를 찾을 수 없습니다.");
  }

  const parsed = JSON.parse(extractJsonFromText(content));
  return validateAIResultShape(parsed);
}

async function generateWithGemini(
  prompt: string,
  env?: Env
): Promise<AIExercisePlanResult> {
  if (!env?.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
  }

  const model = env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": env.GEMINI_API_KEY   // ⭐ 핵심
  },
  body: JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.4
    }
  })
});

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini 호출 실패: ${response.status} ${errorText}`);
  }

  const json: any = await response.json();
  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content || typeof content !== "string") {
    throw new Error("Gemini 응답에서 text를 찾을 수 없습니다.");
  }

  const parsed = JSON.parse(extractJsonFromText(content));
  return validateAIResultShape(parsed);
}

export async function generateExercisePlanWithAI({
  prompt,
  provider,
  env,
  forceUnsafe
}: GenerateExercisePlanParams): Promise<AIExercisePlanResult> {
  switch (provider) {
    case "mock":
      return generateWithMock(prompt, forceUnsafe);
    case "openai":
      return generateWithOpenAI(prompt, env);
    case "cloudflare":
      return generateWithCloudflare(prompt, env);
    case "gemini":
      return generateWithGemini(prompt, env);
    default:
      throw new Error(`지원하지 않는 AI provider입니다: ${provider}`);
  }
}