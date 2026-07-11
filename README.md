# 🏋️‍♂️ AI Workout Recommendation System

개인 맞춤형 운동 루틴을 생성하는 AI 기반 백엔드 시스템입니다.  
사용자의 신체 정보, 통증 부위, 운동 환경을 기반으로  
**Google Gemini AI를 활용하여 안전하고 현실적인 운동 계획을 생성**합니다.

npm install
npm run dev

---

## 🚀 Features

- 🤖 **AI 기반 운동 추천**
  - Google Gemini API 활용
  - 개인 맞춤형 운동 루틴 생성

- 🧠 **프롬프트 엔지니어링**
  - 통증 부위, 운동 목표 반영
  - 안전 규칙 기반 추천

- 📊 **Supabase DB 저장**
  - 추천 결과 자동 저장 (`ai_recommendations`)
  - JSON 구조 그대로 관리

- ⚡ **Cloudflare Workers 기반 서버**
  - 서버리스 아키텍처
  - 빠른 응답 속도

- 🛡️ **입력 검증**
  - Zod 기반 스키마 검증

---

## 🏗️ Architecture


Client (Postman / App)
↓
Cloudflare Worker (Hono)
↓
AI Engine (Google Gemini)
↓
Supabase Database


---

## 📦 Tech Stack

- **Backend**
  - TypeScript
  - Hono (Cloudflare Workers)

- **AI**
  - Google Gemini API

- **Database**
  - Supabase (PostgreSQL)

- **Validation**
  - Zod

---

## 📁 Project Structure


src/
├── endpoints/ # API 라우트
├── workflows/ # 비즈니스 로직
├── services/ # 외부 서비스 (Supabase 등)
├── schemas/ # 요청 검증 (Zod)
└── types/ # 타입 정의


---

## ⚙️ Environment Variables

`.dev.vars` 또는 파일에 아래 값 필요:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash

---

##🧪 API Example

POST /api/exercise-plan/request
{
  "user_info": {
    "age": 24,
    "gender": "male",
    "height_cm": 175,
    "weight_kg": 78,
    "fitness_level": "beginner"
  },
  "goal": "weight_loss",
  "pain_points": ["knee"],
  "available_days_per_week": 3,
  "session_minutes": 25,
  "location": "home",
  "available_equipment": ["mat"],
  "use_ai": true,
  "ai_provider": "gemini",
  "user_id": "USER_UUID",
  "save_to_supabase": true
}

---

##📊 Example Output

운동 루틴 (Warmup / Main / Cooldown)
운동 이유 설명
안전 주의사항
총 운동 시간
🔥 Key Highlights
통증 기반 운동 필터링 (무릎 → 점프 제거)
근력/유산소 자동 구분
JSON 구조 강제 (프론트 연동 최적화)
서버리스 + 이벤트 기반 확장 가능
🚀 Future Improvements
Supabase Webhook 기반 자동 추천
React Native 앱 연동
운동 이력 트래킹
사용자 맞춤 피드백 시스템
