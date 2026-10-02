export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionCategory {
  TOP_UP = 'TOP_UP',
  TRANSFER = 'TRANSFER',
  MONEY_REQUEST = 'MONEY_REQUEST',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}
