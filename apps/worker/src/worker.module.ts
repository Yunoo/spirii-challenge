import { Module } from '@nestjs/common'
import { WorkerService } from './worker.service'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { DataModule as SharedDataModule } from '@shared/data'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AGGREGATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AGGREGATION_SERVICE_HOST || '0.0.0.0',
          port: parseInt(`${process.env.AGGREGATION_SERVICE_PORT}`, 10) || 3002,
        },
      },
    ]),
    SharedDataModule,
  ],
  providers: [WorkerService],
})
export class WorkerModule {}
