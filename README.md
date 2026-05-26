# Nova Flow AI 🌌

Nova Flow AI is a production-ready, feature-rich CRM and Workflow Automation SaaS platform.

This project is built using **Vite** for fast, scalable module bundling and local dev serving.

---

## 🛠️ Quick Start

### 1. Install Dependencies
Run this in your terminal:
```bash
npm install
```

### 2. Run Local Dev Server
Launch the hot-reloading dev server:
```bash
npm run dev
```
Open the local URL displayed (e.g. `http://localhost:5173`) in your browser to interact with the platform!

### 3. Connect Supabase Backend
To connect your live Supabase database:
1. Provision a new project on your [Supabase Dashboard](https://supabase.com).
2. Execute all definitions provided in the `supabase/schema.sql` file in the SQL Editor.
3. Overwrite the URL and Anon Key in your browser console, or update the initialization keys in `src/supabase-config.js`:
```javascript
window.SUPABASE_URL = "https://your-project-id.supabase.co";
window.SUPABASE_ANON_KEY = "your-anon-key-here...";
```
4. Refresh, and the console will connect to your real live Supabase instances seamlessly!
