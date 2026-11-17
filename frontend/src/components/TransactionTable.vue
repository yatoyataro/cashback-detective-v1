<script setup lang="ts">
import { computed } from 'vue'

interface Transaction {
  id: string
  merchant: string
  amount: number
  cashbackAmount: number
  daysSincePurchase: number
  status: string
  userId: string
}

interface Props {
  transactions: Transaction[]
}

const props = defineProps<Props>()

const statusClasses: Record<string, string> = {
  pending: 'status-pending',
  canceled: 'status-canceled',
  returned: 'status-returned',
  credited: 'status-credited'
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  canceled: 'Canceled',
  returned: 'Returned',
  credited: 'Credited'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function getStatusClass(status: string): string {
  return statusClasses[status] || ''
}

function getStatusLabel(status: string): string {
  return statusLabels[status] || status
}
</script>

<template>
  <div class="transaction-table-container">
    <table class="transaction-table">
      <thead>
        <tr>
          <th scope="col">Transaction ID</th>
          <th scope="col">Merchant</th>
          <th scope="col">Amount</th>
          <th scope="col">Cashback</th>
          <th scope="col">Days Since Purchase</th>
          <th scope="col">Status</th>
          <th scope="col">User ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="txn in props.transactions" :key="txn.id">
          <td class="txn-id">{{ txn.id }}</td>
          <td>{{ txn.merchant }}</td>
          <td class="currency">{{ formatCurrency(txn.amount) }}</td>
          <td class="currency">{{ formatCurrency(txn.cashbackAmount) }}</td>
          <td class="days">{{ txn.daysSincePurchase }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(txn.status)">
              {{ getStatusLabel(txn.status) }}
            </span>
          </td>
          <td class="user-id">{{ txn.userId }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="props.transactions.length === 0" class="empty-state">
      <p>No transactions found.</p>
    </div>
  </div>
</template>

<style scoped>
.transaction-table-container {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background-secondary);
}

.transaction-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.transaction-table th,
.transaction-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.transaction-table th {
  background: var(--color-background);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.transaction-table td {
  font-size: 0.9rem;
  color: var(--color-text);
}

.transaction-table tbody tr:last-child td {
  border-bottom: none;
}

.transaction-table tbody tr:hover td {
  background: var(--color-background);
}

.txn-id {
  font-family: monospace;
  font-weight: 500;
  color: var(--color-primary);
}

.currency {
  font-family: monospace;
  font-weight: 500;
}

.days {
  font-family: monospace;
  font-weight: 500;
  color: var(--color-text-muted);
}

.user-id {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.status-pending {
  background: var(--color-warning-translucent);
  color: var(--color-warning);
}

.status-canceled {
  background: var(--color-error-translucent);
  color: var(--color-error);
}

.status-returned {
  background: var(--color-info-translucent);
  color: var(--color-info);
}

.status-credited {
  background: var(--color-success-translucent);
  color: var(--color-success);
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-muted);
}
</style>