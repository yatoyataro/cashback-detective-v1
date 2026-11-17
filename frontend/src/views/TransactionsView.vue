<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTransactions } from '@/services/api'
import TransactionTable from '@/components/TransactionTable.vue'

const transactions = ref<Array<{
  id: string
  merchant: string
  amount: number
  cashbackAmount: number
  daysSincePurchase: number
  status: string
  userId: string
}>>([])

const loading = ref(true)
const error = ref<string | null>(null)

async function loadTransactions() {
  loading.value = true
  error.value = null

  try {
    const result = await getTransactions()
    transactions.value = result.transactions
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load transactions'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTransactions()
})
</script>

<template>
  <div class="transactions-view">
    <header class="view-header">
      <h1>All Transactions</h1>
      <p class="subtitle">{{ transactions.length }} transaction(s) found</p>
    </header>

    <section v-if="loading" class="loading-section">
      <div class="spinner"></div>
      <p>Loading transactions...</p>
    </section>

    <section v-else-if="error" class="error-section" role="alert">
      <div class="error-banner">
        <span class="error-icon" aria-hidden="true">⚠</span>
        <p>{{ error }}</p>
        <button @click="loadTransactions" class="retry-btn">Retry</button>
      </div>
    </section>

    <section v-else class="table-section">
      <TransactionTable :transactions="transactions" />
    </section>
  </div>
</template>

<style scoped>
.transactions-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
}

.view-header {
  text-align: center;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 1000px;
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

.loading-section,
.error-section,
.table-section {
  width: 100%;
  max-width: 1000px;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--color-text-muted);
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
</style>