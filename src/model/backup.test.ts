import { describe, expect, it } from 'vitest'
import { parseBackup } from '../store'

describe('parseBackup', () => {
  it('accepts a valid backup', () => {
    expect(parseBackup('{"teams":[],"games":[],"extra":1}')).toEqual({ teams: [], games: [] })
  })
  it('rejects other JSON', () => {
    expect(() => parseBackup('{"foo":1}')).toThrow('Not a Stat Tracker backup file')
  })
})
