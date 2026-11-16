<script setup lang="ts">
import type { InvestigationResult } from '../services/api'

interface Props {
  data: InvestigationResult
}

const props = defineProps<Props>()

const decisionLabels: Record<string, { label: string; class: string }> = {
  investigation_eligible: { label: 'Investigation Eligible', class: 'decision-eligible' },
  still_pending: { label: 'Still Pending', class: 'decision-pending' },
  ineligible: { label: 'Ineligible', class: 'decision-ineligible' },
  already_credited: { label: 'Already Credited', class: 'decision-credited' },
  policy_unavailable: { label: 'Policy Unavailable', class: 'decision-unavailable' }
}

function getDecisionInfo(decision: string) {
  return decisionLabels[decision] || { label: decision, class: '' }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
</script>

<template>
  <div class="investigation-result">
    <div class="result-header">
      <h2>Investigation Result</h2>
      <span class="transaction-id">{{ data.transactionId }}</span>
    </div>

    <div class="decision-badge" :class="getDecisionInfo(data.decision).class">
      {{ getDecisionInfo(data.decision).label }}
    </div>

    <div class="result-section">
      <h3>Status</h3>
      <p class="status-value">{{ data.status }}</p>
    </div>

    <div class="result-section">
      <h3>Finding</h3>
      <p class="message">{{ data.message }}</p>
    </div>

    <div class="result-section">
      <h3>Next Action</h3>
      <p class="next-action">{{ data.nextAction }}</p>
    </div>

    <div class="result-section evidence">
      <h3>Evidence</h3>
      <dl class="evidence-list">
        <div class="evidence-item">
          <dt>Purchase Amount</dt>
          <dd>{{ formatCurrency(data.evidence.purchaseAmount) }}</dd>
        </div>
        <div class="evidence-item">
          <dt>Expected Cashback</dt>
          <dd>{{ formatCurrency(data.evidence.expectedCashback) }}</dd>
        </div>
        <div class="evidence-item">
          <dt>Days Since Purchase</dt>
          <dd>{{ data.evidence.daysSincePurchase }}</dd>
        </div>
        <div class="evidence-item">
          <dt>Investigation Threshold</dt>
          <dd>
            {{ data.evidence.investigationAfterDays !== null
              ? data.evidence.investigationAfterDays + ' days'
              : 'Not available' }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.investigation-result {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 600px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.result-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.transaction-id {
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: var(--color-background);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
}

.decision-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.decision-eligible {
  background: var(--color-success-translucent);
  color: var(--color-success);
}

.decision-pending {
  background: var(--color-warning-translucent);
  color: var(--color-warning);
}

.decision-ineligible {
  background: var(--color-error-translucent);
  color: var(--color-error);
}

.decision-credited {
  background: var(--color-info-translucent);
  color: var(--color-info);
}

.decision-unavailable {
  background: var(--color-border);
  color: var(--color-text-muted);
}

.result-section {
  margin-bottom: 1.25rem;
}

.result-section h3 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.result-section p {
  margin: 0;
  color: var(--color-text);
  line-height: 1.6;
}

.status-value {
  font-weight: 500;
  text-transform: capitalize;
}

.message {
  font-size: 1rem;
}

.next-action {
  font-size: 1rem;
  font-weight: 500;
}

.evidence {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.evidence-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 0;
}

.evidence-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.evidence-item dt {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.evidence-item dd {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
}
</style>