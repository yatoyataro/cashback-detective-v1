import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import TransactionsView from '../TransactionsView.vue'
import { getTransactions } from '@/services/api'

vi.mock('@/services/api', () => ({
  getTransactions: vi.fn()
}))

const mockTransactions = {
  count: 4,
  transactions: [
    { id: 'TX-1001', merchant: 'Amazon', amount: 150.00, cashbackAmount: 7.50, daysSincePurchase: 5, status: 'pending', userId: 'USER-1' },
    { id: 'TX-1002', merchant: 'eBay', amount: 200.00, cashbackAmount: 10.00, daysSincePurchase: 20, status: 'pending', userId: 'USER-1' },
    { id: 'TX-1003', merchant: 'Walmart', amount: 75.00, cashbackAmount: 3.75, daysSincePurchase: 10, status: 'canceled', userId: 'USER-2' },
    { id: 'TX-1004', merchant: 'Target', amount: 300.00, cashbackAmount: 15.00, daysSincePurchase: 30, status: 'credited', userId: 'USER-3' }
  ]
}

describe('TransactionsView', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    vi.resetAllMocks()
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/transactions', name: 'transactions', component: TransactionsView }
      ]
    })
    ;(getTransactions as vi.Mock).mockResolvedValue(mockTransactions)
  })

  it('renders transactions table with data', async () => {
    const wrapper = mount(TransactionsView, {
      global: { plugins: [router] }
    })

    await router.isReady()
    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(4)
  })

  it('displays transaction data correctly', async () => {
    const wrapper = mount(TransactionsView, {
      global: { plugins: [router] }
    })

    await router.isReady()
    await vi.waitFor(() => expect(wrapper.find('tbody').text()).toContain('TX-1001'))

    expect(wrapper.text()).toContain('Amazon')
    expect(wrapper.text()).toContain('$150.00')
    expect(wrapper.text()).toContain('$7.50')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('Pending')
  })

  it('shows status badges with correct colors', async () => {
    const wrapper = mount(TransactionsView, {
      global: { plugins: [router] }
    })

    await router.isReady()
    await vi.waitFor(() => expect(wrapper.find('.status-badge').exists()).toBe(true))

    const badges = wrapper.findAll('.status-badge')
    expect(badges[0].classes()).toContain('status-pending')
    expect(badges[2].classes()).toContain('status-canceled')
    expect(badges[3].classes()).toContain('status-credited')
  })

  it('shows loading state', async () => {
    ;(getTransactions as vi.Mock).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockTransactions), 100)))

    const wrapper = mount(TransactionsView, {
      global: { plugins: [router] }
    })

    await router.isReady()
    expect(wrapper.text()).toContain('Loading')
  })

  it('shows error message on failure', async () => {
    ;(getTransactions as vi.Mock).mockRejectedValue(new Error('Network error'))

    const wrapper = mount(TransactionsView, {
      global: { plugins: [router] }
    })

    await router.isReady()
    await vi.waitFor(() => expect(wrapper.find('.error-banner').exists()).toBe(true))
    expect(wrapper.text()).toContain('Network error')
  })
})