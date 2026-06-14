import { describe, it, expect, beforeAll } from 'vitest'
import { NetzOoeApiClient } from '../src'

describe('generateDateRange', () => {
  const client = new NetzOoeApiClient({ j_username: '', j_password: '' })

  it('returns correct number of days', () => {
    expect(client.generateDateRange(new Date('2024-01-01'), new Date('2024-01-03'))).toHaveLength(3)
  })

  it('returns correct dates', () => {
    const range = client.generateDateRange(new Date('2024-01-01'), new Date('2024-01-03'))
    expect(range[0]).toBe('2024-01-01')
    expect(range[2]).toBe('2024-01-03')
  })

  it('handles single-day range', () => {
    expect(client.generateDateRange(new Date('2024-06-15'), new Date('2024-06-15'))).toHaveLength(1)
  })
})

describe('buildMeterdataRequest', () => {
  const client = new NetzOoeApiClient({ j_username: '', j_password: '' })

  it('uses ENERGY as default dimension', () => {
    const req = client.buildMeterdataRequest('2024-01-01', 'ACC123', 'MP456')
    expect(req.dimension).toBe('ENERGY')
  })

  it('respects custom dimension', () => {
    const req = client.buildMeterdataRequest('2024-01-01', 'ACC123', 'MP456', 'REACTIVE')
    expect(req.dimension).toBe('REACTIVE')
  })

  it('creates one pod with correct fields', () => {
    const req = client.buildMeterdataRequest('2024-01-01', 'ACC123', 'MP456')
    expect(req.pods).toHaveLength(1)
    expect(req.pods[0]).toMatchObject({
      contractAccountNumber: 'ACC123',
      meterPointAdministrationNumber: 'MP456',
      timerange: { from: '2024-01-01', to: '2024-01-01' },
      bestAvailableGranularity: 'QUARTER_OF_AN_HOUR',
    })
  })
})

const hasCredentials = !!process.env.NETZ_OOE_USERNAME && !!process.env.NETZ_OOE_PASSWORD

describe.skipIf(!hasCredentials)('integration', () => {
  const client = new NetzOoeApiClient({
    j_username: process.env.NETZ_OOE_USERNAME!,
    j_password: process.env.NETZ_OOE_PASSWORD!,
  })

  beforeAll(async () => {
    await client.performAuthFlow()
  })

  it('performAuthFlow authenticates without error', () => {
    // passes if beforeAll did not throw
  })

  it('getDashboardView returns business partners and contract accounts', async () => {
    const dashboard = await client.getDashboardView()
    expect(dashboard.businessPartners.length).toBeGreaterThan(0)
    expect(dashboard.contractAccounts.length).toBeGreaterThan(0)
  })

  it('getMeterData returns data for the first contract account', async () => {
    const dashboard = await client.getDashboardView()
    const account = dashboard.contractAccounts[0]
    const meterPoint = account.contracts[0]?.meterPointAdministrationNumber

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().slice(0, 10)

    const meterData = await client.getMeterData(
      client.buildMeterdataRequest(dateStr, account.contractAccountNumber, meterPoint)
    )

    expect(meterData.meterPointAdministrationNumber).toBe(meterPoint)
  })
})
