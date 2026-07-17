import { describe, expect, test } from 'bun:test'
import { foldIntoOther, truncateLabel } from './charts'

// The render*Chart functions instantiate real Chart.js Chart objects, which
// need a real <canvas> 2D context (not available in bun's jsdom test
// environment). They're covered by browser-based visual verification
// instead; only the pure data-shaping logic is unit tested here.

describe('truncateLabel', () => {
  test('leaves short labels untouched', () => {
    expect(truncateLabel('Gift Card')).toBe('Gift Card')
  })

  test('truncates labels past the max length with an ellipsis', () => {
    const label = 'The Complete Snowboard Collection Deluxe Edition'
    const result = truncateLabel(label, 22)
    expect(result).toBe('The Complete Snowboar…')
    expect(result.length).toBe(22)
  })
})

describe('foldIntoOther', () => {
  test('sorts descending without folding when within the slot limit', () => {
    const result = foldIntoOther([
      { label: 'A', value: 10 },
      { label: 'B', value: 30 },
      { label: 'C', value: 20 },
    ])
    expect(result.map((d) => d.label)).toEqual(['B', 'C', 'A'])
  })

  test('folds everything past the 7th slot into "Other"', () => {
    const slices = Array.from({ length: 10 }, (_, i) => ({
      label: `Product ${i}`,
      value: 10 - i,
    }))
    const result = foldIntoOther(slices)
    expect(result.length).toBe(8)
    expect(result[7].label).toBe('Other')
    // Products 7, 8, 9 have values 3, 2, 1 -> folded sum of 6.
    expect(result[7].value).toBe(6)
  })

  test('leaves exactly 7 slices unfolded', () => {
    const slices = Array.from({ length: 7 }, (_, i) => ({
      label: `Product ${i}`,
      value: i + 1,
    }))
    const result = foldIntoOther(slices)
    expect(result.length).toBe(7)
    expect(result.some((d) => d.label === 'Other')).toBe(false)
  })

  test('accepts a custom cap, e.g. for a longer ranked list', () => {
    const slices = Array.from({ length: 20 }, (_, i) => ({
      label: `Product ${i}`,
      value: 20 - i,
    }))
    const result = foldIntoOther(slices, 15)
    expect(result.length).toBe(16)
    expect(result[15].label).toBe('Other')
    // Products 15..19 have values 5, 4, 3, 2, 1 -> folded sum of 15.
    expect(result[15].value).toBe(15)
  })
})
