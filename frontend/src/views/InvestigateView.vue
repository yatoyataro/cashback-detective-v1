<script setup lang="ts">
import { ref } from 'vue'
import TransactionForm from '../components/TransactionForm.vue'
import InvestigationResultComponent from '../components/InvestigationResult.vue'
import { investigateTransaction } from '../services/api'
import type { InvestigationResult } from '../services/api'

const loading = ref(false)
const error = ref('')
const result = ref<InvestigationResult | null>(null)

async function handleInvestigate(id: string) {
  loading.value = true
  error.value = ''
  result.value = null

  try {
    const data = await investigateTransaction(id)
    result.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}

function handleNewSearch() {
  result.value = null
  error.value = ''
}
</script>

<template>
  <div class="investigate-view">
    <header class="view-header">
      <h1>Cashback Detective</h1>
      <p class="subtitle">Investigate fictional cashback transactions</p>
    </header>

    <main class="view-main">
      <section class="form-section">
        <TransactionForm :loading="loading" @submit="handleInvestigate" />
      </section>

      <section v-if="error" class="error-section" role="alert">
        <div class="error-banner">
          <span class="error-icon" aria-hidden="true">⚠</span>
          <p>{{ error }}</p>
          <button @click="handleNewSearch" class="retry-btn">Try Another</button>
        </div>
      </section>

      <section v-else-if="result" class="result-section">
        <InvestigationResultComponent :data="result" />
        <button @click="handleNewSearch" class="new-search-btn">New Investigation</button>
      </section>

      <section v-else class="empty-state">
        <p>Enter a transaction ID above to begin investigation.</p>
        <ul class="example-ids">
          <li>TX-1001</li>
          <li>TX-1002</li>
          <li>TX-1003</li>
          <li>TX-1004</li>
        </ul>
        <p class="example-hint">These are the available demo transactions.</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.investigate-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
}

.view-header {
  text-align: center;
  margin-bottom: 2rem;
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

.view-main {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  width: 100%;
}

.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--color-error-translucent);
  border: 1px solid var(--color-error);
  border-radius: 8px;
  color: var(--color-error);
}

.error-icon {
  flex-shrink: 0;
  font-size: 1.25rem;
  margin-top: 0.125rem;
}

.error-banner p {
  margin: 0;
  flex: 1;
  font-size: 1rem;
  line-height: 1.5;
}

.retry-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-error);
  background: transparent;
  border: 1px solid var(--color-error);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: var(--color-error-translucent);
}

.result-section {
  width: 100%;
}

.new-search-btn {
  display: block;
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  background: transparent;
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.new-search-btn:hover {
  background: var(--color-primary);
  color: white;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--color-text-muted);
}

.empty-state p {
  margin: 0 0 1rem;
  font-size: 1.1rem;
}

.example-ids {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.example-ids li {
  font-family: monospace;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  transition: border-color 0.2s, background-color 0.2s;
}

.example-ids li:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-translucent);
}

.example-hint {
  margin: 1rem 0 0 !important;
  font-size: 0.9rem !important;
}
</style>