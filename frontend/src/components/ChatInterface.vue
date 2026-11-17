<script setup lang="ts">
import InvestigationResult from './InvestigationResult.vue'
import type { InvestigationResult as InvestigationResultType } from '@/services/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  investigation?: InvestigationResultType | null
}

interface Props {
  messages: Message[]
  loading: boolean
  error: string | null
}

interface Emits {
  send: []
  keydown: [event: KeyboardEvent]
  'update:input': [value: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const input = defineModel<string>('input', { default: '' })

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="chat-interface">
    <div class="messages-container" ref="messagesContainer">
      <div v-for="(message, index) in props.messages" :key="index" class="message" :class="message.role">
        <div class="message-header">
          <span class="message-role">{{ message.role === 'user' ? 'You' : 'Cashback Detective' }}</span>
          <span class="message-time">{{ formatTime(new Date()) }}</span>
        </div>
        <div class="message-content">
          <p>{{ message.content }}</p>
        </div>
        <InvestigationResult v-if="message.investigation" :data="message.investigation" />
      </div>

      <div v-if="props.loading" class="message assistant loading-message">
        <div class="message-header">
          <span class="message-role">Cashback Detective</span>
          <span class="message-time">Sending...</span>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="props.error" class="error-banner" role="alert">
      <span class="error-icon" aria-hidden="true">⚠</span>
      <p>{{ props.error }}</p>
    </div>

    <form @submit.prevent="emit('send')" class="input-form">
      <textarea
        v-model="input"
        @keydown="emit('keydown', $event)"
        :disabled="props.loading"
        placeholder="Ask about cashback or mention a transaction ID (e.g., TX-1001)..."
        rows="2"
        class="chat-input"
        aria-label="Your question"
      />
      <button
        type="submit"
        :disabled="props.loading || !input.trim()"
        class="send-btn"
        :class="{ loading: props.loading }"
      >
        <span v-if="props.loading" class="spinner"></span>
        <span v-else>Send</span>
      </button>
    </form>
  </div>
</template>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
  min-height: 500px;
  max-height: 700px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 85%;
  animation: fadeIn 0.3s ease-out;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.message.user .message-header {
  flex-direction: row-reverse;
}

.message-role {
  color: var(--color-primary);
}

.message.user .message-role {
  color: var(--color-text);
}

.message-time {
  font-weight: 400;
}

.message-content {
  padding: 0.875rem 1rem;
  border-radius: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.message.user .message-content {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.assistant .message-content {
  border-bottom-left-radius: 4px;
}

.message-content p {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 0 1.5rem 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-error-translucent);
  border: 1px solid var(--color-error);
  border-radius: 8px;
  color: var(--color-error);
}

.error-icon {
  flex-shrink: 0;
  font-size: 1rem;
  margin-top: 0.125rem;
}

.error-banner p {
  margin: 0;
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.5;
}

.input-form {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}

.chat-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: inherit;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-secondary);
  color: var(--color-text);
  resize: none;
  min-height: 52px;
  max-height: 150px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.chat-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-translucent);
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-input::placeholder {
  color: var(--color-text-muted);
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  white-space: nowrap;
  height: 52px;
}

.send-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn.loading {
  color: transparent;
}

.spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 0;
}

.typing-indicator span {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--color-text-muted);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-0.5rem);
    opacity: 1;
  }
}
</style>