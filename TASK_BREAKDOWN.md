# Macau Mystery Platform - Task Breakdown & Team Assignment

## v0.2 Current State (Completed)

### Frontend (Next.js 14 + TypeScript + shadcn/ui)
| Page/Component | File | Status |
|---|---|---|
| Homepage (i18n + dynamic route) | `frontend/src/app/page.tsx` | Done |
| Login/Register | `frontend/src/app/login/page.tsx` | Done |
| Game (API connected) | `frontend/src/app/game/[sessionId]/page.tsx` | Done |
| Map (Leaflet) | `frontend/src/app/game/map/page.tsx` | Done |
| Clue Inventory | `frontend/src/app/game/clues/page.tsx` | Done |
| Create Drama (API connected) | `frontend/src/app/create/page.tsx` | Done |
| Create Result (publish/submit) | `frontend/src/app/create/result/page.tsx` | Done |
| Admin Dashboard (API connected) | `frontend/src/app/admin/page.tsx` | Done |
| Admin Manual Create | `frontend/src/app/admin/scripts/new/page.tsx` | Done |
| Admin AI Create (dual mode) | `frontend/src/app/admin/scripts/ai-create/page.tsx` | Done |
| Admin Script Editor | `frontend/src/app/admin/scripts/[id]/page.tsx` | Done |
| Navbar (i18n + auth state) | `frontend/src/components/navbar.tsx` | Done |
| Language Switcher (en/zh-CN/zh-TW) | `frontend/src/components/language-switcher.tsx` | Done |
| Dialogue Box (typewriter effect) | `frontend/src/components/dialogue-box.tsx` | Done |
| Choice Panel | `frontend/src/components/choice-panel.tsx` | Done |
| Clue Card | `frontend/src/components/clue-card.tsx` | Done |
| Map Viewer | `frontend/src/components/map-viewer.tsx` | Done |
| Style Selector | `frontend/src/components/style-selector.tsx` | Done |
| Script Editor | `frontend/src/components/script-editor.tsx` | Done |
| API Client (format adapter) | `frontend/src/lib/api.ts` | Done |
| i18n Translations (3 languages) | `frontend/src/lib/i18n/translations.ts` | Done |
| i18n Context Provider | `frontend/src/lib/i18n/context.tsx` | Done |

### Backend (FastAPI + Python)
| Module | File | Status |
|---|---|---|
| Main entry + router registration | `backend/app/main.py` | Done |
| Auth (login/register/token) | `backend/app/api/auth.py` | Done |
| Game (start/choice/state) | `backend/app/api/game.py` | Done |
| AI Chat (NPC mock) | `backend/app/api/ai.py` | Done |
| UGC Generate (mock) | `backend/app/api/ugc.py` | Done |
| UGC User (publish/submit) | `backend/app/api/ugc_user.py` | Done |
| Admin (CRUD/stats/submissions/AI-gen/route) | `backend/app/api/admin.py` | Done |
| Pydantic Models | `backend/app/models.py` | Done |
| LLM Client (SiliconFlow stub) | `backend/app/ai/llm_client.py` | Done |
| NPC Router (5 NPCs) | `backend/app/ai/npc_router.py` | Done |
| Prompt Templates (5 NPCs) | `backend/app/ai/prompt_templates.py` | Done |
| TTS Service (edge-tts stub) | `backend/app/ai/tts_service.py` | Done |
| Story Engine | `backend/app/story/engine.py` | Done |
| Script Loader | `backend/app/story/script_loader.py` | Done |
| Example Script JSON | `backend/app/story/scripts/macau_mystery_01.json` | Done |
| Knowledge Docs (6 landmarks) | `backend/app/knowledge/docs/` | Done |

---

## Iteration Plan

### v0.3 - Connect Real AI (Priority: HIGH)
- [ ] Get SiliconFlow API Key, fill in `backend/.env`
- [ ] Activate `llm_client.py` real API calls (replace mock)
- [ ] UGC generate use real DeepSeek
- [ ] AI chat responses use real DeepSeek with NPC prompts

### v0.4 - UI Polish (Priority: HIGH)
- [ ] Homepage hero visual upgrade (background, animations)
- [ ] Game page scene illustrations
- [ ] Macau cultural theme (Azulejo blue+gold palette)
- [ ] Scene transition animations

### v0.5 - Complete Script Content (Priority: MEDIUM)
- [ ] Write full 6-chapter script JSON
- [ ] Each chapter = 1 landmark, 3-5 scenes, branching choices
- [ ] Multiple endings based on choices

### v0.6 - Voice + GPS (Priority: MEDIUM)
- [ ] edge-tts integration (Cantonese/Mandarin voices)
- [ ] Browser Geolocation API for map navigation
- [ ] Landmark detail popups with images

### v0.7 - User Features (Priority: MEDIUM)
- [ ] "My Scripts" page for users
- [ ] Public script gallery/community page
- [ ] View counts and likes on UGC scripts

### v0.8 - Admin + Deploy (Priority: MEDIUM)
- [ ] SQLite persistent storage (replace in-memory dicts)
- [ ] Admin chart dashboard (recharts)
- [ ] Docker deployment config
- [ ] Deploy to Vercel + Railway

### v1.0 - Demo Ready (Priority: LOW)
- [ ] AI scene illustrations (Stable Diffusion API)
- [ ] Complete e2e demo flow
- [ ] Presentation slides

---

## Team Assignment (4 People)

### Person A: UI Design + Content Polish
**Role:** Visual design + AI drama quality control

| Task | Version | Files | Details |
|---|---|---|---|
| Homepage hero redesign | v0.4 | `frontend/src/app/page.tsx` | Add background image/gradient, Azulejo texture overlay, entrance animation |
| Game page scene art | v0.4 | `frontend/src/app/game/[sessionId]/page.tsx` | Add scene illustration area (img tag above narration), fade-in transition |
| Theme color update | v0.4 | `frontend/src/app/globals.css` | Change `--primary` from purple to Azulejo blue (#1a4b8c), add gold accent (#c9a84c) |
| Test + polish AI dramas | v0.3 | `frontend/src/app/create/result/page.tsx` | Generate 20+ dramas, note quality issues, suggest prompt improvements to B |
| Landmark popups | v0.6 | `frontend/src/components/map-viewer.tsx` | Add image + description popup for each marker |
| Scene transition animation | v0.4 | `frontend/src/app/game/[sessionId]/page.tsx` | CSS fade-in when scene changes (use useEffect + CSS class toggle) |
| AI scene illustrations | v1.0 | New component | Integrate image generation API, display in narration area |

**Interface Rules for A:**
- CSS changes go in `globals.css` or component-level Tailwind classes
- Use existing shadcn/ui components; add new ones via `npx shadcn@latest add <name>`
- All user-facing text must use `t("key")` from `useTranslation()` hook
- New translation keys must be added to ALL 3 languages in `translations.ts`

---

### Person B: Business Plan + AI Drama Quality
**Role:** Business strategy + content curation + non-tech tasks

| Task | Version | Files | Details |
|---|---|---|---|
| Business plan document | -- | `docs/BUSINESS_PLAN.md` (new) | Market analysis, revenue model (UGC submission fees, tourism partnerships), competitive landscape |
| Test AI drama quality | v0.3 | N/A (manual testing) | Generate 30+ dramas across all 4 styles, document quality issues |
| NPC character bible | v0.5 | `backend/app/ai/prompt_templates.py` | Write detailed personality backstories for all 5 NPCs (in Chinese, I'll help format) |
| Script content writing | v0.5 | `backend/app/story/scripts/macau_mystery_01.json` | Write chapters 2-6 JSON (I'll provide template format) |
| Presentation slides | v1.0 | `docs/PRESENTATION/` (new) | Demo flow script, key talking points |
| Competitive analysis | -- | `docs/COMPETITIVE_ANALYSIS.md` (new) | Compare with existing tourism apps, escape rooms, script games |
| UGC prompt optimization | v0.3 | `backend/app/ugc/templates.py` | Based on testing results, improve generation prompts |

**Interface Rules for B:**
- Business docs in Markdown format in `docs/` folder
- Script JSON must follow the schema in `macau_mystery_01.json` (chapters > scenes > choices + clue_rewards)
- NPC prompts must use `{location}` and `{clues}` placeholders
- Submit all content changes as PRs (Person D will review)

---

### Person C: Backend AI + Integration
**Role:** Connect real AI, complete backend features

| Task | Version | Files | Details |
|---|---|---|---|
| SiliconFlow API integration | v0.3 | `backend/app/ai/llm_client.py` | Uncomment real API code, test with different models |
| UGC real AI generation | v0.3 | `backend/app/api/ugc.py` | Replace mock `generate_drama()` with real DeepSeek call using templates |
| NPC chat real responses | v0.3 | `backend/app/api/ai.py` | Connect chat endpoint to `llm_client.chat_with_npc()` |
| ChromaDB installation + RAG | v0.5 | `backend/app/knowledge/` | `pip install chromadb sentence-transformers`, run `seed_knowledge.py` |
| edge-tts voice synthesis | v0.6 | `backend/app/ai/tts_service.py` | Uncomment real TTS code, test voice IDs |
| SQLite persistent storage | v0.8 | New: `backend/app/database.py` | Create SQLite tables, replace `scripts_db`/`users_db` dicts |
| Real view/play counters | v0.7 | `backend/app/api/ugc_user.py` | Track views and plays in database |

**Interface Rules for C:**
- All API endpoints return JSON with snake_case field names
- Frontend adapter in `api.ts` handles snake_case to camelCase conversion
- New endpoints must be registered in `main.py` with proper prefix
- Test all endpoints with `Invoke-RestMethod` before committing
- Python files: NO Chinese full-width punctuation in code (SyntaxError risk)
- Use `D:\Anaconda3\envs\macau-mystery\python.exe` for all pip/uvicorn commands

**API Response Format Contract:**
```
Game:     POST /api/v1/game/start     -> { session_id, chapter, location, narration, dialogue, choices }
          POST /api/v1/game/choice    -> { scene_id, chapter, location, narration, dialogue, choices, clue_reward? }
AI:       POST /api/v1/ai/chat       -> { response, audio_url? }
UGC:      POST /api/v1/create/generate -> { script_id, title, chapters, style, era }
Admin:    GET  /api/v1/admin/scripts  -> [{ id, title, status, chapters_count, players_count, views_count, created_at }]
Auth:     POST /api/v1/auth/login    -> { token, user: { id, username, nickname, role } }
```

---

### Person D: Frontend Features + DevOps + GitHub Admin
**Role:** User-facing features, deployment, PR reviewer

| Task | Version | Files | Details |
|---|---|---|---|
| "My Scripts" user page | v0.7 | New: `frontend/src/app/my-scripts/page.tsx` | List user's generated scripts with publish status |
| Community/gallery page | v0.7 | New: `frontend/src/app/community/page.tsx` | Browse public UGC scripts, play, like |
| Browser geolocation | v0.6 | `frontend/src/components/map-viewer.tsx` | Add `navigator.geolocation.watchPosition()` for real-time tracking |
| Complete i18n for remaining pages | v0.4 | All pages under `frontend/src/app/` | Replace hardcoded strings with `t()` calls |
| Admin chart dashboard | v0.8 | `frontend/src/app/admin/page.tsx` | Add recharts line/bar charts for player stats |
| Deploy to Vercel | v0.8 | Vercel dashboard | Connect repo, auto-deploy on push to main |
| PR review + merge | Ongoing | GitHub | Review all team PRs, ensure no conflicts |
| Script editor enhancement | v0.5 | `frontend/src/components/script-editor.tsx` | Improve UX, add drag-to-reorder scenes |

**Interface Rules for D:**
- New pages must follow existing layout: `<div className="container mx-auto px-4 py-6">` wrapper
- Use `useTranslation()` hook for ALL user-visible text
- New routes auto-detected by Next.js App Router (just create `page.tsx` in folder)
- PR review checklist: build passes, no console errors, i18n keys exist in all 3 languages
- Deployment: frontend auto-deploys via Vercel; backend needs manual Railway deploy

**GitHub Admin Duties:**
- Protect `main` branch (require PR + 1 review)
- Create labels: `ui`, `backend`, `content`, `bug`, `feature`
- Merge PRs after review
- Tag releases: `v0.3`, `v0.4`, etc.

---

## Daily Workflow

```
1. git pull origin main          (get latest)
2. git checkout -b my-feature    (create branch)
3. ... make changes ...
4. git add -A && git commit -m "feat: description"
5. git push origin my-feature
6. Create PR on GitHub
7. Request review from D (or any teammate)
8. After review + approval, D merges
```

## Startup Commands (Daily)

```powershell
# Backend (Terminal 1)
cd D:\macau-mystery\backend
conda activate macau-mystery
uvicorn app.main:app --reload --port 8000

# Frontend (Terminal 2)
cd D:\macau-mystery\frontend
npm run dev
```

## Project Structure Quick Reference

```
D:\macau-mystery/
  frontend/                      # Next.js 14
    src/app/                     # Pages (App Router)
      page.tsx                   # Homepage (i18n)
      login/page.tsx             # Login/Register
      game/[sessionId]/page.tsx  # Game session
      game/map/page.tsx          # Map
      game/clues/page.tsx        # Clues
      create/page.tsx            # Create drama
      create/result/page.tsx     # Result + publish
      admin/page.tsx             # Admin dashboard
      admin/scripts/ai-create/   # AI dual-mode create
      admin/scripts/new/         # Manual create
      admin/scripts/[id]/        # Edit script
    src/components/              # Shared components
      navbar.tsx                 # Nav (i18n + auth)
      language-switcher.tsx      # Language dropdown
      dialogue-box.tsx           # NPC dialogue
      choice-panel.tsx           # Game choices
      map-viewer.tsx             # Leaflet map
      script-editor.tsx          # Admin editor
    src/lib/
      api.ts                     # API client (all endpoints)
      api-base.ts                # API base URL
      i18n/translations.ts       # 3-language dictionary
      i18n/context.tsx           # Language provider + hook
  backend/                       # FastAPI
    app/
      main.py                    # Entry point + routers
      models.py                  # Pydantic schemas
      api/
        auth.py                  # Login/register/token
        game.py                  # Game start/choice/state
        ai.py                    # NPC chat/TTS
        ugc.py                   # Drama generation
        ugc_user.py              # User publish/submit
        admin.py                 # Admin CRUD/stats/review
      ai/
        llm_client.py            # SiliconFlow DeepSeek
        npc_router.py            # NPC assignments
        prompt_templates.py      # NPC personalities
        tts_service.py           # edge-tts wrapper
      story/
        engine.py                # Game state machine
        scripts/                 # Script JSON files
      knowledge/
        docs/                    # Landmark text files
```
