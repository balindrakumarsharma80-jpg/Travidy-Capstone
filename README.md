# Travidy-Capstone
Capstone project for 6 months Gen AI Course at IIT Patna 
# Travidy — AI-Powered Travel Planning for Indian Domestic Travelers

Travidy is an AI-powered travel planning app built for Indian domestic travelers, covering the full trip lifecycle — from planning to on-the-ground use to sharing the experience afterward. Built as a capstone project during the Gen AI course at IIT Patna.

## The Problem

Planning a domestic trip in India usually means stitching together scattered blog posts, generic checklists, and guesswork — with no single assistant that understands a specific destination well enough to give grounded, useful answers instead of generic travel-blog fluff.

## What It Does

Travidy is structured around three phases of a trip:

1. **Pre-trip** — an AI chat assistant that answers destination-specific questions, grounded in real, ingested knowledge (not generic LLM guesses), and can pull in live web results or hotel search when needed.
2. **During-trip** — a checklist experience to keep travelers organized on the ground.
3. **Post-trip** — a sharing flow so travelers can pass their itinerary and experience along to others.

Six Indian cities are currently ingested into the knowledge base, including Ranchi.

## My Role

I was **Team Lead and AI/Automation Lead**. I owned the RAG pipeline architecture, the AI chat backend, and the automation/ingestion tooling, while coordinating the overall build sequence across the team.

## Architecture

**Backend & Data**
- Supabase (Postgres) with `pgvector` as the RAG vector store
- Knowledge base ingestion via a self-hosted **n8n** pipeline using Gemini embeddings (`gemini-embedding-001`, 3072-dim vectors)

**AI Chat**
- Served via Supabase Edge Functions using **Gemini function-calling**, with three tools available to the model:
  - `search_knowledge_base` — retrieval over the ingested destination data
  - `search_web` — live web search via Tavily, for anything outside the knowledge base
  - `search_hotels` — hotel search integration

**Frontend**
- TanStack Start (Vinxi / Nitro SSR), deployed on Vercel
- Guest users get a **local-only itinerary** (stored in `localStorage`, no database rows created) until they choose to share it — keeping the guest experience fast and avoiding unnecessary data writes
- Guest chat is routed by `destination_id` rather than `trip_id`, since guests aren't tied to a specific trip yet

## Technical Challenges & How They Were Solved

- **Nitro build preset misconfiguration** blocking Vercel deployment — diagnosed and corrected the SSR build target.
- **Missing server-side environment variables** in production — traced and resolved the Vercel env var gaps.
- **TanStack version mismatches** causing build failures — pinned and aligned dependency versions.
- **Duplicate destination rows** silently degrading RAG retrieval quality — found and fixed a data-seeding bug that was polluting the vector store.
- **Google Drive OAuth, `pdf-parse` compatibility, and embedding dimension mismatches** during n8n pipeline setup — resolved to get reliable, repeatable ingestion.

## Status

Reached a working production deployment on Vercel. The live demo link isn't public (the Gemini API key is on a paid tier with a hard billing cap, and open sharing risked unpredictable cost) — see the screenshots/demo GIF in this repo instead.

## Tech Stack

`Supabase` · `pgvector` · `n8n` · `Gemini API` (embeddings + function-calling) · `Tavily` · `TanStack Start` · `Vercel`

## Project Docs

Early planning included a full PRD, a 12-slide pitch deck, and a team one-pager — available in [`/docs`](./docs) *(add this folder if you want to include them)*.

---

*Built as part of the Gen AI course capstone at IIT Patna.*
