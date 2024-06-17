export type DataParams = {
  users: number
  transactPerUser: number
  lastFecthDate: Date
}

export interface TransactionResponse {
  items: Transaction[]
  meta: Metadata
}

export interface Transaction {
  id: string
  userId: string
  createdAt: Date
  type: TransactionType
  amount: number
}

export enum TransactionType {
  payout = 'payout',
  spent = 'spent',
  earned = 'earned'
}

export interface Metadata {
  totalItems: number
  itemCount: number
  itemsPerPage?: number
  totalPages?: number
  currentPage?: number
}

export interface userData {
  balance: number
  earned: number
  spent: number
  payout: number
}