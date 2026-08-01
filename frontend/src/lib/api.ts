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

// Game API - adapts backend snake_case flat response to frontend expected format
export const gameApi = {
  start: async (
    scriptId: string
  ): Promise<{ sessionId: string; scene: any }> => {
    const res: any = await request("/game/start", {
      method: "POST",
      body: JSON.stringify({ script_id: scriptId }),
    });
    return {
      sessionId: res.session_id,
      scene: {
        id: "scene_" + res.session_id,
        chapter: res.chapter,
        location: res.location,
        narration: res.narration,
        dialogue: res.dialogue,
        choices: res.choices,
      },
    };
  },

  makeChoice: async (
    sessionId: string,
    choiceId: string
  ): Promise<{ scene: any; clue?: any }> => {
    const res: any = await request("/game/choice", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, choice_id: choiceId }),
    });
    return {
      scene: {
        id: res.scene_id || "scene_next",
        chapter: res.chapter,
        location: res.location,
        narration: res.narration,
        dialogue: res.dialogue,
        choices: res.choices,
      },
      clue: res.clue_reward || undefined,
    };
  },

  getState: (sessionId: string) => request<any>(`/game/state/${sessionId}`),
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
