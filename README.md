# SCARECROW Web Dashboard

A separate React + Vite + TypeScript web dashboard for the existing SCARECROW Supabase project. It does not modify or replace the Expo mobile application.

## Requirements
- Node.js 20+
- Existing SCARECROW Supabase project
- An existing administrator account

## Setup
1. Open this `web` project folder in VS Code.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the same Supabase project used by the mobile app. Use only the publishable/anon key. Never use the service-role key in frontend code.
5. Start the app: `npm run dev`

## Current functionality
- Existing Supabase email/password sign-in
- Reads `devices` and `detection_logs`
- Realtime refresh for device changes and newly inserted detection events
- Device online state based on `last_seen` within 30 seconds
- Bird detection and event history with search
- Reads and saves the signed-in user's `notification_preferences`

## Important notes
- This first version intentionally does not create, archive, or delete devices. Those actions should be added only after reviewing the deployed `manage-device` Edge Function and its safeguards.
- The app assumes the existing database has the `devices`, `detection_logs`, and `notification_preferences` tables and the policies needed for authenticated reads and preference upserts.
- Enable Supabase Realtime for `devices` and `detection_logs` if it is not already enabled.
- Do not expose secrets. Frontend variables are public at build time; the anon/publishable key must rely on correctly configured Row Level Security.
