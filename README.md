# Night-Hawkers-UNIHACK

# 🚀 CareerCheatCode 

> **Hackathon MVP:** A one-click AI tool that reads your messy resume, analyzes a target job description, and generates a personalized interview survival guide & skill tree.

## 💡 The Pitch
Job hunting is broken. Candidates spend hours guessing what recruiters want. CareerCheatCode instantly bridges the gap between your current experience and your dream job using generative AI. 

## 🛠 Tech Stack
* **Frontend:** React + Vite + TypeScript
* **Styling:** Tailwind CSS
* **Backend:** Vercel Serverless Functions (TypeScript)
* **AI Engine:** Anthropic Claude / OpenAI API
* **Deployment:** Vercel
* **Documentation:** Swagger UI / OpenAPI

---

## 🎯 Hackathon Scope (The 48-Hour Plan)

### What's INSIDE (The Core MVP)
* **The AI "Tailor" Engine:** Compares a resume to a job description and rewrites bullet points to match keywords.
* **The AI "Skill Tree":** Identifies missing skills between the user and the JD, generating a 3-step actionable learning path.
* **Stateless Architecture:** Data lives in the browser for a frictionless, no-login-required demo.

### What's OUTSIDE (Skipped for the weekend)
* 🛑 Real User Authentication (Mocked for demo)
* 🛑 Relational Database Setup (Stored in React state)
* 🛑 Complex PDF Generation (Rendered beautifully in UI instead)

---

## 🔌 API Architecture

We designed a comprehensive, enterprise-grade REST API. For this 48-hour sprint, we are prioritizing the AI core (`/resumes/tailor` and `/skills/tree`).

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **User Profile** | `PATCH` | `/users/me/profile` | Updates basic user details. |
| **User Profile** | `POST` | `/users/me/resume/upload` | Uploads raw resume file. |
| **User Profile** | `POST` | `/users/me/resume/extract` | AI parses uploaded resume to JSON. |
| **Jobs** | `GET` | `/jobs` | Fetches available job listings. |
| **Resumes** | `POST` | `/resumes/tailor` | **🔥 MVP:** AI tailors resume to a JD. |
| **Skill Tree** | `POST` | `/skills/tree` | **🔥 MVP:** AI generates learning path. |

> **Note:** Full API documentation is available in `swagger.yaml` at the root of this project.

---

## 👥 Team & Roles
* **Hacker 1 (Frontend):** UI/UX, React State, Tailwind Styling.
* **Hacker 2 (Backend & AI):** Vercel Serverless setup, Prompt Engineering, API integration.
* **Hacker 3 (Integrator):** Connecting frontend to backend, QA testing, edge cases.
* **Hacker 4 (Pitch Master):** Slide deck, demo script, UI data population.

---

## 🚀 How to Run Locally

Because we are using Vite + Vercel Serverless Functions, use the Vercel CLI to run both the frontend and backend simultaneously.

**1. Install Dependencies**
```bash
npm install