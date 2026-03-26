# JC Summit — LiveCards 🚀

A premium, real-time question display system developed for **ACM MUJ** events. Built with a focus on high-agency design, cinematic animations, and instant updates.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

---

## ✨ Features

- 💎 **Premium Aesthetic**: Dark mode, Apple Music-inspired glassmorphism, and abstract animated backgrounds.
- ⚡ **Real-Time Synchronisation**: Instant question updates powered by Supabase-backed APIs.
- 🔒 **Secure Admin Panel**: Password-protected dashboard for clear-board, question deletion, and live moderation.
- 🌪️ **Cinematic UI**: Text scrambling, spring physics card animations, and liquid-glass borders (powered by Framer Motion).
- 🗄️ **Supabase Integration**: Permanent data persistence using PostgreSQL with ultra-low latency response times.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS + Vanilla CSS (Variables)
- **Animations**: Framer Motion
- **Data/Auth**: Supabase Auth + Next.js API Route Handlers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Project (URL & Service Role Key)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ronitdoes/jc-summit-26.git
   cd jc-summit-26
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Create a .env.local with:
   # NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   # SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   npm run dev
   ```

## Vercel Deployment

Deploy the `frontend` app to Vercel as a Next.js project.

1. Import this repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Keep defaults for Next.js framework detection.
4. Add these environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_URL` (optional; same value as `NEXT_PUBLIC_SUPABASE_URL`)
5. Redeploy after updating env vars.

Notes:
- Frontend pages and API routes run from Next.js in `frontend/app` and are compatible with Vercel.

---


## 🏆 Credits

Developed by **ACM Student Chapter — Manipal University Jaipur**.
