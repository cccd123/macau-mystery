import { API_BASE } from "./api-base";

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }

    throw new ApiError(
      res.status,
      body?.error?.message || `API Error: ${res.status} ${res.statusText}`,
      body?.error?.code,
      body?.error?.details
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface GameMedia {
  video_url: string;
  poster_url: string;
  mime_type: string;
  duration_ms?: number;
}

export interface GameChoice {
  id: string;
  text: string;
  preload: {
    scene_id: string;
    media: GameMedia;
  };
}

export interface GameClue {
  id: string;
  title: string;
  description: string;
  icon?: string;
  acquired_at: string;
}

export interface GameSnapshot {
  session_id: string;
  status: "active" | "completed";
  story: {
    id: string;
    title: string;
    version: number;
  };
  scene: {
    id: string;
    type: "video" | "ending";
    chapter: {
      id: string;
      title: string;
      location: string;
    };
    media: GameMedia;
    choices: GameChoice[];
  };
  clues: GameClue[];
  progress: {
    current_chapter: number;
    total_chapters: number;
  };
  awarded_clues?: GameClue[];
  ending?: {
    id: string;
    code: string;
  };
}

export interface MakeChoiceInput {
  sessionId: string;
  sceneId: string;
  choiceId: string;
  requestId: string;
}

// Versioned immersive game API. Keep the backend's snake_case snapshot intact.
export const gameApi = {
  start: (scriptId: string) =>
    request<GameSnapshot>("/game/start", {
      method: "POST",
      body: JSON.stringify({ script_id: scriptId }),
    }),

  makeChoice: ({ sessionId, sceneId, choiceId, requestId }: MakeChoiceInput) =>
    request<GameSnapshot>("/game/choice", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        scene_id: sceneId,
        choice_id: choiceId,
        request_id: requestId,
      }),
    }),

  getState: (sessionId: string) =>
    request<GameSnapshot>(`/game/state/${sessionId}`),
};

// AI API
export const aiApi = {
  chat: (npcId: string, message: string, context?: any) =>
    request<{ response: string; audio_url?: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ npc_id: npcId, message, context }),
    }),

  getTts: (text: string, voice?: string) =>
    request<{ audio_url: string }>(
      `/ai/tts?text=${encodeURIComponent(text)}&voice=${voice || ""}`
    ),
};

// UGC API
export const ugcApi = {
  generate: (input: string, style: string, options: any) =>
    request<any>("/create/generate", {
      method: "POST",
      body: JSON.stringify({ input, style, options }),
    }),

  regenerate: (scriptId: string) =>
    request<any>(`/create/regenerate/${scriptId}`, { method: "POST" }),

  listMyScripts: () => request<any[]>("/ugc/my-scripts"),

  publishScript: (scriptId: string, isPublic: boolean) =>
    request<any>(`/ugc/publish/${scriptId}`, {
      method: "POST",
      body: JSON.stringify({ is_public: isPublic }),
    }),

  submitToOfficial: (scriptId: string) =>
    request<any>(`/ugc/submit/${scriptId}`, { method: "POST" }),
};

// Admin API
export const adminApi = {
  listScripts: () => request<any[]>("/admin/scripts"),

  createScript: (data: any) =>
    request<any>("/admin/scripts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateScript: (id: string, data: any) =>
    request<any>(`/admin/scripts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteScript: (id: string) =>
    request<void>(`/admin/scripts/${id}`, { method: "DELETE" }),

  publishScript: (id: string) =>
    request<void>(`/admin/scripts/${id}/publish`, { method: "POST" }),

  aiGenerateScript: (input: string, mode: string) =>
    request<any>("/admin/scripts/ai-generate", {
      method: "POST",
      body: JSON.stringify({ input, mode }),
    }),

  listSubmissions: () => request<any[]>("/admin/submissions"),

  reviewSubmission: (id: string, action: string) =>
    request<any>(`/admin/submissions/${id}/${action}`, { method: "POST" }),

  getStats: () => request<any>("/admin/stats"),

  getRoute: () => request<any>("/admin/route"),
};

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, nickname: string) =>
    request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, nickname }),
    }),

  me: () => request<any>("/auth/me"),
};
