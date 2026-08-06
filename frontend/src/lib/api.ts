import { API_BASE } from "./api-base";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

/* ============================
   TYPES - Game API v1 (C backend)
   ============================ */

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

export interface GameChapter {
  id: string;
  title: string;
  location: string;
}

export interface GameScene {
  id: string;
  type: "video" | "ending";
  chapter: GameChapter;
  media: GameMedia;
  choices: GameChoice[];
}

export interface GameClue {
  id: string;
  title: string;
  description: string;
  icon?: string;
  acquired_at: string;
}

export interface GameProgress {
  current_chapter: number;
  total_chapters: number;
}

export interface GameEnding {
  id: string;
  code: string;
}

export interface StoryLocation {
  id: string;
  title: string;
  location: string;
  gps: { lat: number; lng: number } | null;
}

export interface StoryInfo {
  slug: string;
  title: string;
  description: string;
  chapters: StoryLocation[];
}

export interface LocationInfo {
  id: string;
  order: number;
  name: string;
  summary: string;
  description: string;
  coordinates: { lat: number; lng: number };
  source_title: string;
  source_url: string;
}

export interface GameSnapshot {
  session_id: string;
  status: "active" | "completed";
  story: { id: string; title: string; version: number };
  scene: GameScene;
  clues: GameClue[];
  progress: GameProgress;
  awarded_clues?: GameClue[];
  ending?: GameEnding;
}

/* ============================
   GAME API
   ============================ */

export const gameApi = {
  start: async (scriptId: string): Promise<GameSnapshot> => {
    return request<GameSnapshot>("/game/start", {
      method: "POST",
      body: JSON.stringify({ script_id: scriptId }),
    });
  },

  makeChoice: async (
    sessionId: string,
    sceneId: string,
    choiceId: string
  ): Promise<GameSnapshot> => {
    return request<GameSnapshot>("/game/choice", {
      method: "POST",
      body: JSON.stringify({
        session_id: sessionId,
        scene_id: sceneId,
        choice_id: choiceId,
        request_id: crypto.randomUUID(),
      }),
    });
  },

  getState: (sessionId: string) => request<GameSnapshot>(`/game/state/${sessionId}`),

  getStories: () => request<StoryInfo[]>("/game/stories"),
};

export const locationApi = {
  list: () => request<{ items: LocationInfo[] }>("/locations"),
  get: (id: string) => request<LocationInfo>(`/locations/${id}`),
};

export interface UploadTarget {
  object_key: string;
  method: "PUT";
  upload_url: string;
  headers: Record<string, string>;
  public_url: string;
  expires_at: string;
}

export interface StoredObject {
  object_key: string;
  public_url: string;
  content_type: string;
  size_bytes: number;
  etag: string;
  status: "ready";
}

export const mediaApi = {
  requestUpload: (body: {
    kind: "video" | "poster";
    filename: string;
    content_type: string;
    size_bytes: number;
  }) =>
    request<UploadTarget>("/admin/media/uploads", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  completeUpload: (body: {
    object_key: string;
    kind: "video" | "poster";
    expected_size_bytes: number;
  }) =>
    request<StoredObject>("/admin/media/uploads/complete", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

/* ============================
   AI API
   ============================ */

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

/* ============================
   UGC API
   ============================ */

export const ugcApi = {
  generate: (input: string, style: string, options: any) =>
    request<any>("/create/generate", {
      method: "POST",
      body: JSON.stringify({ input, style, options }),
    }),

  regenerate: (scriptId: string) =>
    request<any>(`/create/regenerate/${scriptId}`, { method: "POST" }),

  listMyScripts: () => request<any[]>("/ugc/my-scripts"),

  listPublicScripts: () => request<any[]>("/ugc/public"),

  publishScript: (scriptId: string, isPublic: boolean) =>
    request<any>(`/ugc/publish/${scriptId}`, {
      method: "POST",
      body: JSON.stringify({ is_public: isPublic }),
    }),

  submitToOfficial: (scriptId: string) =>
    request<any>(`/ugc/submit/${scriptId}`, { method: "POST" }),
};

/* ============================
   ADMIN API
   ============================ */

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

/* ============================
   AUTH API
   ============================ */

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
