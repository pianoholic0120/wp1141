# Web Programming Course Portfolio

This repository documents the assignments completed for the NTU Web Programming course. It captures a progression from foundational web development to full-stack applications and intelligent chatbot systems. Assignments HW1 through HW6 are complete; later assignments and the final project will be added as they are delivered.

## Assignments at a Glance

| Assignment | Status | Technologies | Focus |
|------------|--------|--------------|-------|
| HW1 | Complete | HTML5, CSS3, TypeScript | Personal portfolio site with responsive layout |
| HW2 | Complete | React 18, TypeScript | Sliding blocks puzzle with audio and animation |
| HW3 | Complete | React 19, TypeScript, Tailwind, shadcn/ui | Course registration workflow with live data updates |
| HW4 | Complete | React 18, TypeScript, Node.js, Express, SQLite, Google Maps API | Rental property platform with map integration |
| HW5 | Complete | Next.js (App Router), React 18, Tailwind, Prisma, PostgreSQL, Pusher | Social network with OAuth, real-time feed, and notifications |
| HW6 | Complete | Next.js 14, TypeScript, MongoDB, LINE Messaging API, OpenAI, Google Gemini | Intelligent LINE chatbot for concert ticket booking with admin dashboard |
| HW7 | Planned | TBD | To be announced |
| Final Project | Planned | TBD | To be announced |

## Assignment Highlights

### HW1 Personal Portfolio Website
- Developed with standards-compliant HTML5, modern CSS3, and TypeScript without external frameworks.
- Responsive layout tailored for desktop, tablet, and mobile breakpoints using Flexbox and CSS Grid.
- Includes structured sections for education, skills, projects, and contact information with semantic markup.

### HW2 Sliding Blocks Coverage Game
- Built with React 18 and TypeScript, styled via CSS Modules.
- Implements synchronized block movement across grid sizes from 3×3 to 6×6 with eight difficulty levels.
- Provides keyboard and touch controls, audio feedback, animated victory effects, and local storage persistence.

### HW3 NTU Course Registration Service
- React 19 application using Tailwind CSS and the shadcn/ui component library with a custom design system.
- Features a four-stage workflow: course discovery, schedule planning, registration submission, and modification.
- Supports CSV hot reload within five seconds, multilingual UI, advanced filtering, and real-time conflict detection.
- Employs Context API with `useReducer` for deterministic state management and includes extensive accessibility work.

### HW4 Taiwan Rental Property Platform
- Full-stack implementation: React 18 frontend (Vite), Express.js backend, TypeScript throughout, and SQLite storage.
- Integrates Google Maps for geocoding, reverse geocoding, property pinning, and distance-aware search.
- Delivers secure JWT authentication, favorites, ratings, and property CRUD operations with immediate UI updates.
- Ships with automated setup scripts, curated seed data exceeding 400 listings, and REST API documentation.

### HW5 Vector Social Network
- Next.js App Router project combining React 18, Tailwind CSS, Prisma ORM, PostgreSQL, and Pusher.
- Provides multi-provider OAuth via NextAuth.js (Google, GitHub, Facebook, credentials) with custom user IDs.
- Supports threaded conversations, reposts, mentions, hashtags, drafts, visibility settings, and real-time counters.
- Includes production-ready tooling: setup scripts, environment scaffolding, Prisma migrations, and Vercel deployment notes.

### HW6 Opentix Concert Ticket Booking Assistant
- Production-ready LINE chatbot system built with Next.js 14, TypeScript, and MongoDB Atlas.
- Integrates LINE Messaging API for webhook-based message handling with signature validation and secure request processing.
- Features multi-LLM support with automatic fallback between OpenAI GPT and Google Gemini models for resilient service delivery.
- Implements intelligent event search, multilingual support (Traditional Chinese and English), context-aware conversations, and interactive Flex Message carousels.
- Includes comprehensive admin dashboard with real-time conversation monitoring, advanced search and filtering, analytics, and database health checks.
- Delivers graceful error handling, conversation persistence, session management, and production deployment on Vercel with MongoDB Atlas integration.

## Skill Progression

- **Foundations (HW1):** Semantic HTML, responsive CSS, TypeScript fundamentals, accessibility principles.
- **Interactive Frontend (HW2):** Component architecture, stateful game logic, animation and audio integration.
- **Complex Client Applications (HW3):** State orchestration with Context API, live data pipelines, design system implementation.
- **Full-Stack Development (HW4):** API design, authentication, database modeling, third-party API integration.
- **Scalable Web Apps (HW5):** Next.js server components, real-time communication, OAuth, infrastructure automation.
- **Intelligent Chatbot Systems (HW6):** LINE Messaging API integration, LLM orchestration, conversation management, webhook security, and real-time monitoring dashboards.
- **Future Work (HW7–Final):** Advanced topics will be documented upon completion.

## Development Environment

- **Prerequisites:** Node.js 18 or higher, npm or yarn, modern Chromium-based or WebKit browsers.
- **Per-Assignment Setup:** Each assignment includes a dedicated README with environment configuration and runtime instructions.
- **Repository Workflow:**
  ```bash
  git clone <repository-url>
  cd wp1141
  cd hw<number>
  npm install
  npm run dev
  ```

## Engineering Standards

- **Code Quality:** Strict TypeScript settings, modular architecture, comprehensive error handling, and clear separation of concerns.
- **Design and UX:** Mobile-first responsive layouts, consistent design tokens, user feedback mechanisms, and keyboard accessibility.
- **Development Practices:** Version-controlled documentation, descriptive commit history, automated scripts, and readiness for CI/CD integration.
- **Testing and Reliability:** Unit and integration testing where applicable, manual verification scripts, and monitoring hooks for live systems.

## Compatibility Targets

| Browser | Minimum Version | Support |
|---------|-----------------|---------|
| Chrome | 90 | Fully supported |
| Firefox | 88 | Fully supported |
| Safari | 14 | Fully supported |
| Edge | 90 | Fully supported |

- **Desktop:** Full functionality and optimized layouts.
- **Tablet:** Touch-friendly interactions and adaptive components.
- **Mobile:** Streamlined navigation with prioritized content hierarchy.

## Usage Policy

Projects are provided for educational purposes. Personal learning and reference use are permitted. Commercial use or redistribution requires prior approval.

## Support and Contribution

- Consult individual assignment READMEs for build steps, troubleshooting guidance, and known issues.
- For course-related questions, contact the instructor or refer to official documentation.
- Contributions follow a fork-and-pull workflow: create a feature branch, implement changes, and open a pull request for review.

## Reference Materials

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

Ongoing updates will capture future assignments and the final project as they are delivered.