# How to Run MySivi Dashboard

## Windows

1. Open PowerShell.
2. Go to the dashboard folder:

   ```powershell
   Set-Location "C:\Users\rainc\Downloads\Projects(intern)\Projects(intern)\mysivi\mysivi-ad-dashboard"
   ```

3. If PowerShell reports that `npm.ps1` cannot be loaded, allow scripts only for the current PowerShell process:

   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

   This process-only setting expires when PowerShell closes. Alternatively, bypass the PowerShell wrapper without changing policy:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

4. Install dependencies once:

   ```powershell
   npm install
   ```

5. Start the dashboard:

   ```powershell
   npm run dev
   ```

6. Open the URL shown in the terminal, normally:

   ```text
   http://localhost:5173
   ```

Alternatively, double-click `run-dashboard.bat`.

## Supabase Setup

1. Confirm `.env` contains:

   ```text
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

2. Restart `npm run dev` after changing `.env`.
3. Create a user in Supabase Authentication.
4. Enable the authenticated read policy from `supabase/dashboard_read_policy.sql`.
5. Sign in with the Supabase user email and password.

Never put the Supabase `service_role` key in `.env` or in frontend code.
