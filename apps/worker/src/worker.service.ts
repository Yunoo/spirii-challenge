import { DataService as SharedDataService } from '@shared/data'
import { Inject, Injectable, Logger, OnApplicationShutdown } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { switchMap, Subscription, BehaviorSubject, takeUntil, Subject, timer, firstValueFrom, timeout, of } from 'rxjs'

import type { Transaction, TransactionResponse } from '@shared/data'

@Injectable()
export class WorkerService implements OnApplicationShutdown {
  private readonly logger = new Logger(WorkerService.name)
  private subscription: Subscription | undefined
  private bSubject = new BehaviorSubject<number>(0)
  private pendingData: Array<Transaction> = []
  private fetchInterval: number = 12000 // Every 12 seconds
  private lastFetchDate: Date = new Date()

  constructor(
    @Inject('AGGREGATION_SERVICE') private aggregationServiceProxy: ClientProxy,
    private sharedDataService: SharedDataService,
  ) {}

  private fetchData(): TransactionResponse {
    // TODO: Should use Axios when we have a working Transaction API endpoint
    // Might be better to write a working axios function and mock it with the following code
    return this.sharedDataService.generateData({
      users: Math.floor(Math.random() * 100) + 1,
      transactPerUser: Math.floor(Math.random() * 15),
      lastFecthDate: this.lastFetchDate,
    })
  }

  // Deduplicate and merge received data
  private parseFetchedData(data: Transaction[]): Transaction[] {
    // TODO: Set the max size of a pendingData Map to limit memory usage
    return [
      ...this.sharedDataService
        .mergeMaps(
          this.sharedDataService.createMapFromObjects(data),
          this.sharedDataService.createMapFromObjects([...this.pendingData]),
        )
        .values(),
    ]
  }

  async publishFetchedData(data: Transaction[]): Promise<any> {
    const latestData = this.parseFetchedData(data)
    try {
      // TODO: Consider sending data to a dedicated queue rather than utilising a direct connection to another service via TCP protocol
      const pattern = { cmd: 'aggregation' }
      const result = await firstValueFrom(
        this.aggregationServiceProxy.send(pattern, JSON.stringify(latestData)).pipe(timeout(3_000)),
      )
      this.pendingData = []
      this.logger.log('Data was successfully published')
      return result
    } catch (error: any) {
      this.logger.error(`Sending data to 'aggregation' service was unsuccessful.\n${error.message}`)
      this.pendingData = latestData
      this.logger.debug(`Number of pending data entries: ${this.pendingData.length}`)
      // TODO: Notify that the fetching service has issues
    }
  }

  getWorkerStatus(): boolean {
    /*
     * TODO: We might want to save/load the latest worker state into/from a storage in case our service is restarted
     * We might also need to save the last succesful request execution timestamp in order to prevent a request
     * to fire right away on service recovery/restart by offsetting the start time
     */
    return this.subscription?.closed === false
  }

  stopFetch() {
    if (this.getWorkerStatus()) {
      this.subscription?.unsubscribe()
      this.logger.log('Stopping data fetching')
      return
    }
    this.logger.log('Data fetching is already disabled')
  }

  startFetch(seconds: number) {
    // Ignore if are already fetching data
    if (this.getWorkerStatus() === true) {
      this.logger.log('Data is already being fetched')
      return
    }

    this.logger.log('Starting data fetching')

    // Run fetch every x seconds. Wait for response to finish before running again
    const intervalObservable = this.bSubject.asObservable().pipe(
      takeUntil(new Subject<any>()),
      switchMap((time: number) => timer(time)),
      switchMap(() => {
        this.lastFetchDate = new Date()
        const result = this.fetchData()
        this.logger.verbose(result)
        return of(result)
      }),
    )

    this.subscription = intervalObservable.subscribe({
      next: ({ items }) => {
        // Call observable again after x seconds
        this.bSubject.next(seconds)
        this.logger.debug(JSON.stringify(items))

        // Send data back to data-stream
        this.publishFetchedData(items)
      },
      error: error => {
        // Handle any errors that occur during the request
        this.logger.error('Critical error in request fetcher:', error.message)
        this.stopFetch()
        // Critical error. Me might want to re-run startFetch()
        this.startFetch(this.fetchInterval)
      },
    })
  }

  onApplicationBootstrap() {
    this.startFetch(this.fetchInterval)
  }

  onApplicationShutdown() {
    this.stopFetch()
    // TODO: Unload pending data to aggregation service or local db (async)
  }
}
