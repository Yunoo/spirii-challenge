import { Injectable, Logger } from '@nestjs/common'
import { Transaction, userData } from '@shared/data'

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)
  private dataStorage: Map<string, userData> = new Map()
  constructor() {}

  async getAggregated(id: string): Promise<userData | undefined> {
    if (!id) return undefined
    return this.dataStorage.get(id)
  }

  async syncData(data: string): Promise<void> {
    // TODO: Sync data with the local db
    try {
      this.logger.verbose('Saving received data into storage')
      const parsedData: Transaction[] = JSON.parse(data)
      const reduced = parsedData.reduce((acc, value) => {
        const user = acc.get(value.userId)

        type Key = keyof typeof user
        const balance = (user?.earned || 0) - ((user?.spent || 0) + (user?.payout || 0))

        acc.set(value.userId, {
          balance,
          earned: user?.earned || 0,
          spent: user?.spent || 0,
          payout: user?.payout || 0,
          [value.type]: (user?.[`${value.type}` as Key] || 0) + value.amount,
        })

        return acc
      }, new Map<string, userData>())

      // TODO: Refactor
      for (const [key, value] of reduced) {
        const data = this.dataStorage.get(key)
        this.dataStorage.set(key, {
          balance: (data?.balance || 0) + value.balance,
          earned: (data?.earned || 0) + value.earned,
          spent: (data?.spent || 0) + value.spent,
          payout: (data?.payout || 0) + value.payout,
        })
      }

      this.logger.verbose(JSON.stringify([...this.dataStorage.entries()]))
    } catch (error: any) {
      this.logger.error('Unable to parse/save received data')
      this.logger.error(error.message)
    }
  }

  findAll() {
    return this.dataStorage
  }
}
