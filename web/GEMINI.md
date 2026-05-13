# Customer Web App

## Overview
The primary web application for Team Chords customers.

## Tech Stack
- **Framework:** React 19, Vite 7
- **Routing:** React Router 7
- **State Management:** Zustand
- **Styling:** Tailwind CSS 4
- **Real-time:** SignalR Client
- **Auth:** Auth0 React SDK

## Conventions
- **Routing:** Standard React Router conventions.
- **State:** Use Zustand stores for global client-side state.
- **Real-time:** Hub connections should be managed efficiently, typically within hooks or specialized services.
- **Styling:** Uses Tailwind CSS 4.

## Development
- Run via .NET Aspire or `npm run dev` in this directory.
- Standard port: 5173.
