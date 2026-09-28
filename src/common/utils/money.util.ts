import { BadRequestException } from '@nestjs/common';

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export function parseAmountToCents(amount: number | string): number {
  if (amount === null || amount === undefined || amount === '') {
    throw new BadRequestException('Invalid amount');
  }

  const value = typeof amount === 'number' ? amount.toString() : amount.trim();

  if (!MONEY_PATTERN.test(value)) {
    throw new BadRequestException('Invalid amount');
  }

  const [whole, decimal = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new BadRequestException('Invalid amount');
  }

  return cents;
}

export function centsToAmount(cents: number): number {
  return cents / 100;
}

export function formatAmount(cents: number): string {
  return centsToAmount(cents).toFixed(2);
}
