export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolStatus?: "running" | "done" | "error";
  timestamp: number;
}

const now = Date.now();

export const MOCK_CHAT: Record<string, ChatMessage[]> = {
  "mock-approval-1": [
    {
      id: "msg-1",
      role: "user",
      content: "claude-mon 프로젝트를 빌드해줘",
      timestamp: now - 60000,
    },
    {
      id: "msg-2",
      role: "assistant",
      content:
        "네, `claude-mon` 프로젝트를 빌드하겠습니다. 먼저 현재 상태를 확인합니다.",
      timestamp: now - 55000,
    },
    {
      id: "msg-3",
      role: "tool",
      toolName: "Read",
      toolStatus: "done",
      content:
        '```json\n{\n  "name": "claude-mon",\n  "version": "0.1.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  }\n}\n```',
      timestamp: now - 50000,
    },
    {
      id: "msg-4",
      role: "assistant",
      content:
        "`package.json`을 확인했습니다. 빌드 명령어를 실행합니다.\n\n>[!INFO] **참고**: TypeScript 컴파일 후 Vite 빌드가 진행됩니다.",
      timestamp: now - 45000,
    },
    {
      id: "msg-5",
      role: "tool",
      toolName: "Bash",
      toolStatus: "running",
      content: "```bash\nnpm run build\n```",
      timestamp: now - 40000,
    },
  ],
  "mock-processing-1": [
    {
      id: "msg-1",
      role: "user",
      content: "API 서버의 라우팅 구조를 분석해줘",
      timestamp: now - 120000,
    },
    {
      id: "msg-2",
      role: "assistant",
      content:
        "## API 서버 라우팅 분석\n\n현재 프로젝트의 라우팅 구조를 살펴보겠습니다.\n\n### 주요 엔드포인트\n\n| Path | Method | Description |\n|------|--------|-------------|\n| `/api/users` | GET | 사용자 목록 |\n| `/api/users/:id` | GET | 사용자 상세 |\n| `/api/auth/login` | POST | 로그인 |\n| `/api/auth/logout` | POST | 로그아웃 |\n\n### 미들웨어 체인\n\n1. `cors()` - CORS 처리\n2. `authMiddleware` - 인증 검증\n3. `rateLimiter` - 요청 제한\n\n> [!NOTE] `authMiddleware`는 `/api/auth/*` 경로를 제외합니다.",
      timestamp: now - 100000,
    },
  ],
  "mock-idle-1": [
    {
      id: "msg-1",
      role: "user",
      content: "Hello!",
      timestamp: now - 300000,
    },
    {
      id: "msg-2",
      role: "assistant",
      content: "안녕하세요! 무엇을 도와드릴까요?",
      timestamp: now - 295000,
    },
  ],
};
