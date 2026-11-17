import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AskView from '../AskView.vue'
import { askQuestion } from '@/services/api'

vi.mock('@/services/api', () => ({
  askQuestion: vi.fn()
}))

const mockAskResponse = {
  answer: 'Cashback Detective helps you investigate cashback transactions. Enter a transaction ID like TX-1001 to get started.',
  investigation: null,
  answerSource: 'predefined'
}

const mockAskResponseWithInvestigation = {
  answer: 'This transaction is eligible for investigation.',
  investigation: {
    transactionId: 'TX-1001',
    status: 'pending',
    decision: 'investigation_eligible',
    message: 'Transaction TX-1001 is eligible for investigation.',
    nextAction: 'Wait for the investigation period to complete.',
    evidence: {
      purchaseAmount: 150.00,
      expectedCashback: 7.50,
      daysSincePurchase: 5,
      investigationAfterDays: 14
    }
  },
  answerSource: 'rules_engine'
}

describe('AskView', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    vi.resetAllMocks()
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/ask', name: 'ask', component: AskView }
      ]
    })
    ;(askQuestion as vi.Mock).mockResolvedValue(mockAskResponse)
  })

  it('renders chat interface', async () => {
    const wrapper = mount(AskView, {
      global: { plugins: [router] }
    })

    await router.isReady()
    await vi.waitFor(() => expect(wrapper.find('.chat-interface').exists()).toBe(true))

    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('sends question and displays answer', async () => {
    const wrapper = mount(AskView, {
      global: { plugins: [router] }
    })

    await router.isReady()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('What is Cashback Detective?')
    await wrapper.find('form').trigger('submit.prevent')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Cashback Detective helps'))

    expect(askQuestion).toHaveBeenCalledWith('What is Cashback Detective?')
  })

  it('detects transaction ID in question and shows investigation', async () => {
    ;(askQuestion as vi.Mock).mockResolvedValue(mockAskResponseWithInvestigation)

    const wrapper = mount(AskView, {
      global: { plugins: [router] }
    })

    await router.isReady()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('What about TX-1001?')
    await wrapper.find('form').trigger('submit.prevent')

    await vi.waitFor(() => expect(wrapper.text()).toContain('TX-1001'))
    await vi.waitFor(() => expect(wrapper.text()).toContain('Investigation Eligible'))
  })

  it('shows loading state while waiting for response', async () => {
    ;(askQuestion as vi.Mock).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockAskResponse), 100)))

    const wrapper = mount(AskView, {
      global: { plugins: [router] }
    })

    await router.isReady()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Test question')
    await wrapper.find('form').trigger('submit.prevent')

    await vi.waitFor(() => expect(wrapper.text()).toContain('Sending'))
  })

  it('shows error message on failure', async () => {
    ;(askQuestion as vi.Mock).mockRejectedValue(new Error('Network error'))

    const wrapper = mount(AskView, {
      global: { plugins: [router] }
    })

    await router.isReady()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('Test question')
    await wrapper.find('form').trigger('submit.prevent')

    await vi.waitFor(() => expect(wrapper.find('.error-banner').exists()).toBe(true))
    expect(wrapper.text()).toContain('Network error')
  })

  it('disables send button when input is empty', async () => {
    const wrapper = mount(AskView, {
      global: { plugins: [router] }
    })

    await router.isReady()

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('maintains message history', async () => {
    const wrapper = mount(AskView, {
      global: { plugins: [router] }
    })

    await router.isReady()

    const textarea = wrapper.find('textarea')
    await textarea.setValue('First question')
    await wrapper.find('form').trigger('submit.prevent')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Cashback Detective helps'))

    await textarea.setValue('Second question')
    await wrapper.find('form').trigger('submit.prevent')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Cashback Detective helps'))

    expect(wrapper.findAll('.message')).toHaveLength(4) // 2 user + 2 assistant
  })
})