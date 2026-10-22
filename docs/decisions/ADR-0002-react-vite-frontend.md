# ADR-0002: Frontend Architecture with React and Vite

## Status
Accepted

## Context
Per `docs/Tech_Stack.md`, the primary developers are proficient in React and JavaScript. While `docs/PROJECT_BRIEF.md` originally mentioned Next.js, the approved technology addendum specifically selected React + Vite to prioritize team agility and minimize unnecessary SSR complexity for what is primarily an authenticated institutional dashboard.

## Decision
We select **React 18/19 with Vite** for the frontend:
- Single Page Application (SPA) architecture communicating with FastAPI via standard REST contracts.
- Vanilla CSS with a bespoke dark-mode institutional design system (utilizing modern CSS custom properties, Inter typography, glassmorphism, responsive CSS grid/flexbox) without unneeded heavy utility libraries.
- Clean separation of features (`auth`, `dashboard`, `documents`, `admin`) and centralized API client services.

## Consequences
- **Positive:** Extremely fast hot-module reloading, low developer cognitive overhead, seamless static hosting.
- **Negative:** Client-side rendering means initial bundle must load before render, which is completely acceptable for authenticated enterprise portals.
