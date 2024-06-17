import { Transport, MicroserviceOptions } from '@nestjs/microservices'
import { NestFactory } from '@nestjs/core'
import { WorkerModule } from './worker.module'

const app = await NestFactory.createMicroservice<MicroserviceOptions>(WorkerModule, {
  transport: Transport.TCP,
  options: {
    host: '0.0.0.0',
    port: parseInt(`${process.env.WORKER_PORT}`, 10) || 3001,
  },
})
await app.listen()
