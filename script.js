const modelMeta = {
  "sonar": { label:"Search", badge:"badge-search", desc:"Lightweight, cost-effective search model with grounding. Great for quick factual queries, topic summaries, and current events." },
  "sonar-pro": { label:"Search", badge:"badge-search", desc:"Advanced search offering with grounding, supporting complex queries and multi-turn follow-ups." },
  "sonar-reasoning": { label:"Reasoning", badge:"badge-reasoning", desc:"Reasoning model with Chain of Thought and real-time search. Best for complex analyses and step-by-step thinking." },
  "sonar-reasoning-pro": { label:"Reasoning", badge:"badge-reasoning", desc:"Precise reasoning offering with Chain of Thought (CoT), powered by DeepSeek-R1. Best for complex analyses and logical problem-solving." },
  "sonar-deep-research": { label:"Research", badge:"badge-research", desc:"Expert-level research model conducting exhaustive web searches and generating comprehensive, source-rich reports." }
};

const modelSelect = document.getElementById("model-select");
const modelBadge = document.getElementById("model-badge");
const modelName = document.getElementById("model-name");
const modelDesc = document.getElementById("model-desc");
const headerModel = document.getElementById("header-model");
const apiKeyInput = document.getElementById("api-key-input");
const systemPromptInput = document.getElementById("system-prompt");
const messagesEl = document.getElementById("messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const welcomeEl = document.getElementById("welcome");

let conversationHistory = [];
let isStreaming = false;

// Model card update
function updateModelCard() {
  const m = modelSelect.value;
  const meta = modelMeta[m];
  modelBadge.textContent = meta.label;
  modelBadge.className = "model-badge " + meta.badge;
  modelName.textContent = m;
  modelDesc.textContent = meta.desc;
  headerModel.textContent = m;
}
modelSelect.addEventListener("change", updateModelCard);
updateModelCard();

// Toggle password
const togglePw = document.getElementById("toggle-pw");
const pwEye = document.getElementById("pw-eye");
let pwVisible = false;
togglePw.addEventListener("click", () => {
  pwVisible = !pwVisible;
  apiKeyInput.type = pwVisible ? "text" : "password";
  pwEye.innerHTML = pwVisible
    ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

// Auto-resize textarea
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + "px";
});

// Enter to send
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!isStreaming) handleSend();
  }
});
sendBtn.addEventListener("click", handleSend);

// Clear chat
function clearChat() {
  conversationHistory = [];
  messagesEl.innerHTML = "";
  messagesEl.appendChild(welcomeEl);
  welcomeEl.style.display = "";
}
document.getElementById("clear-btn").addEventListener("click", clearChat);
document.getElementById("clear-btn-sidebar").addEventListener("click", clearChat);

// Mobile sidebar
const sidebar = document.getElementById("sidebar");
document.getElementById("sidebar-toggle").addEventListener("click", () => sidebar.classList.add("open"));
document.getElementById("sidebar-close").addEventListener("click", () => sidebar.classList.remove("open"));

// Helpers
function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessage(role, content) {
  if (welcomeEl.parentElement) welcomeEl.style.display = "none";

  const row = document.createElement("div");
  row.className = "msg-row " + role;

  const av = document.createElement("div");
  av.className = "avatar " + (role === "user" ? "user-av" : "ai-av");
  av.textContent = role === "user" ? "U" : "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  row.appendChild(av);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  scrollToBottom();
  return bubble;
}

function showError(msg) {
  const div = document.createElement("div");
  div.className = "error-msg";
  div.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  const span = document.createElement("span");
  span.textContent = msg;
  div.appendChild(span);
  messagesEl.appendChild(div);
  scrollToBottom();
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  row.id = "typing-row";

  const av = document.createElement("div");
  av.className = "avatar ai-av";
  av.textContent = "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;

  row.appendChild(av);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  scrollToBottom();
  return { row, bubble };
}

// Main send
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showError("Please enter your Perplexity API key in the sidebar.");
    return;
  }

  userInput.value = "";
  userInput.style.height = "auto";
  isStreaming = true;
  sendBtn.disabled = true;

  addMessage("user", text);
  conversationHistory.push({ role: "user", content: text });

  const { row: typingRow, bubble: typingBubble } = addTypingIndicator();

  const systemPrompt = systemPromptInput.value.trim() || "You are a helpful AI assistant.";
  const model = modelSelect.value;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory
  ];

  let fullText = "";

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
        "Accept": "text/event-stream"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      let errMsg = `API error ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.error?.message) errMsg = errData.error.message;
        else if (errData.detail) errMsg = errData.detail;
        else if (typeof errData.error === "string") errMsg = errData.error;
      } catch {}
      if (response.status === 401) errMsg = "Invalid API key. Please check your key in the sidebar.";
      else if (response.status === 429) errMsg = "Rate limit exceeded. Please wait a moment and try again.";
      else if (response.status === 400) errMsg = errMsg || "Bad request. Check your model selection or system prompt.";
      typingRow.remove();
      showError(errMsg);
      conversationHistory.pop();
      return;
    }

    // Switch typing bubble to real bubble
    typingBubble.innerHTML = "";
    typingRow.id = "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            typingBubble.innerHTML = DOMPurify.sanitize(marked.parse(fullText));
            scrollToBottom();
          }
        } catch {}
      }
    }

    if (!fullText) fullText = "*(No response content)*";
    typingBubble.innerHTML = DOMPurify.sanitize(marked.parse(fullText));
    conversationHistory.push({ role: "assistant", content: fullText });

  } catch (err) {
    typingRow.remove();
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      showError("Network error. Check your internet connection or if the API URL is reachable.");
    } else {
      showError("Unexpected error: " + err.message);
    }
    conversationHistory.pop();
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
    userInput.focus();
    scrollToBottom();
  }
}

// Marked options
marked.use({ breaks: true, gfm: true });
