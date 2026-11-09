# RippleMap

> "One change. Every consequence."

RippleMap is an AI-powered tool that identifies how a change in one document affects related documents, detects conflicting information, and suggests evidence-supported revisions. Built for the BharatCode Build League hackathon.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI Integration**: BharatCode AI API (proxied securely through the backend)

## Project Structure
- `client/`: React + TypeScript frontend
- `server/`: Express + TypeScript backend with secure AI proxy

## Quick Start

### 1. Backend Setup
```bash
cd server
npm install
# Copy the example environment template and add your API key:
cp .env.example .env
npm run dev
```
The server will run at `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
The client will run at `http://localhost:5173`.
