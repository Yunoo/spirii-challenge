import { Body, Controller, Get, Logger, Post, UsePipes, ValidationPipe, Param } from '@nestjs/common'
import { AppService } from './app.service'
import { MessagePattern } from '@nestjs/microservices'

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name)
  constructor(private readonly appService: AppService) {}

  @Get(':id')
  async find(@Param('id') id: string): Promise<any> {
    if (!id) return { data: null }
    const data = await this.appService.getAggregated(id)
    return { data: this.appService.getAggregated(id) }
  }

  // TODO: Not implemented
  @Get('/payout/:id')
  async findOne(@Param('id') id: string): Promise<any> {
    if (!id) return { data: null }
    return { data: [] }
  }

  // TODO: Consider reading events from a queue rather than using plain TCP to improve data persistence
  @MessagePattern({ cmd: 'aggregation' })
  readData(data: string) {
    try {
      this.logger.log('Data received from worker')
      this.logger.debug(data)
      this.appService.syncData(data)
    } catch {
    } finally {
      return true
    }
  }
}
