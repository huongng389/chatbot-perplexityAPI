# Perplexity Chatbot — Huong Ng

A lightweight, single-page AI chatbot built with vanilla HTML, CSS, and JavaScript. It connects directly to the [Perplexity AI API](https://docs.perplexity.ai/) from the browser — no backend, no framework, no build step.

## Features

- **5 Perplexity models** — Sonar (search), Sonar Pro, Sonar Reasoning, Sonar Reasoning Pro, Sonar Deep Research
- **Streaming responses** — tokens render in real time as the AI replies
- **Markdown rendering** — responses rendered with [marked.js](https://marked.js.org/) and sanitized with [DOMPurify](https://github.com/cure53/DOMPurify)
- **Conversation history** — full multi-turn context sent with each request
- **Customizable system prompt** — adjust AI behavior per session
- **Responsive layout** — collapsible sidebar for mobile screens

## Project Structure

```
chatbot/
├── perplexity_chatbot.html   # App entry point and HTML structure
├── styles.css                # All styles and CSS variables
├── script.js                 # All JavaScript logic
└── README.md
```

## Getting Started

### Prerequisites

- A [Perplexity API key](https://www.perplexity.ai/settings/api) (`pplx-...`)

### Run locally

**Option 1 — Open directly in browser**

Double-click `perplexity_chatbot.html`. Works in most cases.

**Option 2 — Local dev server (recommended)**

Some browsers block `fetch` from `file://` origins. Serve the folder instead:

```bash
# Python
python -m http.server 8080
```

Then open `http://localhost:8080/perplexity_chatbot.html`.

Or use the **Live Server** extension in VS Code: right-click `perplexity_chatbot.html` → _Open with Live Server_.

### Usage

1. Enter your Perplexity API key in the sidebar
2. Select a model
3. Optionally edit the system prompt
4. Type a message and press **Enter** to send

## Models

| Model                 | Type      | Best for                               |
| --------------------- | --------- | -------------------------------------- |
| `sonar`               | Search    | Quick factual queries, current events  |
| `sonar-pro`           | Search    | Complex queries, multi-turn follow-ups |
| `sonar-reasoning`     | Reasoning | Step-by-step thinking + web search     |
| `sonar-reasoning-pro` | Reasoning | Precise CoT reasoning (DeepSeek-R1)    |
| `sonar-deep-research` | Research  | Exhaustive research reports            |

## Security

- API responses rendered via `marked.js` are sanitized with **DOMPurify** to prevent XSS
- API error messages are set via `textContent` (not `innerHTML`) to prevent injection
- API key is stored only in the browser input field — never sent anywhere except the Perplexity API

## Dependencies (CDN)

| Library                                                | Version | Purpose           |
| ------------------------------------------------------ | ------- | ----------------- |
| [marked](https://cdn.jsdelivr.net/npm/marked/)         | latest  | Markdown parsing  |
| [DOMPurify](https://cdn.jsdelivr.net/npm/dompurify@3/) | 3.x     | HTML sanitization |
