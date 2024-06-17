import { AppModule } from './app.module'
import { INestApplication, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { Transport } from '@nestjs/microservices'

const initMicroservice = async (app: INestApplication) => {
  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: parseInt(`${process.env.AGGREGATION_SERVICE_PORT}`, 10) || 3002,
    },
  })
  await app.startAllMicroservices()
}

const app = await NestFactory.create(AppModule)
app.enableVersioning({
  defaultVersion: '1',
  type: VersioningType.URI,
})
await initMicroservice(app)
await app.listen(parseInt(`${process.env.APP_PORT}`, 10) || 3000)
