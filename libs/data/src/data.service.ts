import { Injectable } from '@nestjs/common'
import { faker } from '@faker-js/faker'
import type { DataParams, Transaction, TransactionResponse, TransactionType } from './data.types'

@Injectable()
export class DataService {
  createMapFromObjects(array?: Transaction[]): Map<string, Transaction> {
    if (!Array.isArray(array)) return new Map()

    const map = new Map<string, Transaction>()
    for (const obj of array) map.set(obj.id, obj)
    return map
  }

  mergeMaps(primaryMap: Map<string, Transaction>, secondaryMap: Map<string, Transaction>): Map<string, Transaction> {
    const mergedMap = new Map<string, Transaction>(primaryMap)

    for (const [key, value] of secondaryMap) {
      if (!mergedMap.has(key)) mergedMap.set(key, value)
    }
    return mergedMap
  }

  generateData(params: DataParams): TransactionResponse {
    const type = ['payout', 'spent', 'earned']
    const data = []
    for (let i = 0; i < params.users; i++) {
      const userId = faker.string.numeric({ length: 2, allowLeadingZeros: true, exclude: ['0'] })
      for (let y = 0; y < params.transactPerUser; y++) {
        data.push({
          id: faker.string.uuid(),
          userId,
          createdAt: faker.date.between({ from: params.lastFecthDate, to: new Date() }),
          type: faker.helpers.arrayElement(type) as TransactionType,
          amount: faker.number.float({ min: 0.1, max: 100, multipleOf: 2 }),
        })
      }
    }

    return { items: data, meta: { totalItems: data.length, itemCount: data.length } }
  }
}
