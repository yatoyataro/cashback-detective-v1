<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  loading: boolean
}

interface Emits {
  submit: [id: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const transactionId = ref('')
const error = ref('')

const TX_PATTERN = /^TX-\d{4}$/

function validateInput(): boolean {
  if (!transactionId.value.trim()) {
    error.value = 'Please enter a transaction ID'
    return false
  }
  if (!TX_PATTERN.test(transactionId.value.trim().toUpperCase())) {
    error.value = 'Invalid format. Use TX-NNNN (e.g., TX-1001)'
    return false
  }
  error.value = ''
  return true
}

function handleSubmit(event: Event) {
  event.preventDefault()
  if (validateInput()) {
    emit('submit', transactionId.value.trim().toUpperCase())
  }
}

function handleInput() {
  if (error.value) {
    validateInput()
  }
}
</script>

<template>
  <form @submit="handleSubmit" class="transaction-form">
    <label for="transaction-id" class="form-label">Transaction ID</label>
    <div class="input-group">
      <input
        id="transaction-id"
        type="text"
        v-model="transactionId"
        @input="handleInput"
        :disabled="props.loading"
        placeholder="TX-1001"
        class="form-input"
        :class="{ 'input-error': error }"
        autocomplete="off"
      />
      <button
        type="submit"
        :disabled="props.loading || !transactionId.trim()"
        class="submit-btn"
      >
        <span v-if="props.loading" class="spinner"></span>
        <span v-else>Investigate</span>
      </button>
    </div>
    <p v-if="error" class="error-message">{{ error }}</p>
    <p class="hint">Format: TX-NNNN (e.g., TX-1001, TX-1002, TX-1003, TX-1004)</p>
  </form>
</template>

<style scoped>
.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 480px;
}

.form-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text);
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.form-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-translucent);
}

.form-input.input-error {
  border-color: var(--color-error);
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 3px var(--color-error-translucent);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  white-space: nowrap;
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.error-message {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-error);
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>