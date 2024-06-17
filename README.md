# Challenge

## Running

### Development

Install the packages 
```bash
npm install
```
Create an `.env` file in the project root (Get your own API_KEY from NY Times API or use the one from docker-compose)
```bash
APP_PORT=3000
WORKER_PORT=3001
AGGREGATION_SERVICE_PORT=3002
```
Run service
```bash
npm start aggregation
npm start worker
```
