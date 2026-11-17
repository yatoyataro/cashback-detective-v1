<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { askQuestion } from '@/services/api'
import ChatInterface from '@/components/ChatInterface.vue'
import type { AskResult } from '@/services/api'

import type { InvestigationResult } from '@/services/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  investigation?: InvestigationResult | null
}

const messages = ref<Message[]>([])
const input = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const txPattern = /TX-\d{4}/i

async function sendMessage() {
  const text = input.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  loading.value = true
  error.value = null

  try {
    const result: AskResult = await askQuestion(text)
    messages.value.push({
      role: 'assistant',
      content: result.answer,
      investigation: result.investigation || undefined
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to send message'
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please try again.'
    })
  } finally {
    loading.value = false
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="ask-view">
    <header class="view-header">
      <h1>Ask Cashback Detective</h1>
      <p class="subtitle">Ask questions about cashback or investigate transactions by mentioning their ID</p>
    </header>

    <main class="chat-main">
      <ChatInterface
        :messages="messages"
        v-model:input="input"
        :loading="loading"
        :error="error"
        @send="sendMessage"
        @keydown="handleKeyDown"
      />
    </main>
  </div>
</template>

<style scoped>
.ask-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
}

.view-header {
  text-align: center;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 800px;
}

.view-header h1 {
  margin: 0 0 0.5rem;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.chat-main {
  width: 100%;
  max-width: 800px;
  flex: 1;
}
</style>