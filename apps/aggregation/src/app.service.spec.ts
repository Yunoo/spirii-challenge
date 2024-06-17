import { Test, TestingModule } from '@nestjs/testing'
import { AppService } from './app.service'

describe('AppService', () => {
  let appService: AppService

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile()

    appService = app.get<AppService>(AppService)
  })

  describe('Send and receive TCP commands', () => {
    it('should sync received data', async () => {
      const now = new Date().toISOString()
      const data = [
        {
          id: '4368ad45-04cf-423c-a111-3d0062b29655',
          userId: '2',
          createdAt: '2024-06-17T12:45:27.823Z',
          type: 'payout',
          amount: 14,
        },
        {
          id: 'f93a910f-ed31-49aa-a4f0-4beaa95cb4e2',
          userId: '2',
          createdAt: '2024-06-17T12:45:27.824Z',
          type: 'earned',
          amount: 20,
        },
      ]

      await appService.syncData(JSON.stringify(data[0]))
      const storedData = Object.values(Object.fromEntries(await appService.findAll()))
      expect(storedData).toMatchObject(data)
    })
    it('should not have any stored data', async () => {
      expect(await appService.getAggregated('2')).toMatchObject(new Map())
    })
  })
})
