import { matchPath } from 'react-router-dom';
import type { TradeType } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';

/** Public sell/buy list routes → listing trade type. */
export function tradeTypeFromListPath(pathname: string): TradeType {
  if (matchPath({ path: ROUTES.TRADE_LIST_BUY, end: true }, pathname)) return 'buy';
  if (matchPath({ path: ROUTES.TRADE_LIST_SELL, end: true }, pathname)) return 'sell';
  return pathname.includes('/buy') ? 'buy' : 'sell';
}

/** Owner write routes → listing trade type. */
export function tradeTypeFromWritePath(pathname: string): TradeType {
  if (matchPath({ path: ROUTES.TRADE_BUY_WRITE, end: true }, pathname)) return 'buy';
  if (matchPath({ path: ROUTES.TRADE_SELL_WRITE, end: true }, pathname)) return 'sell';
  return pathname.includes('/buy/') ? 'buy' : 'sell';
}

/** Owner manage routes → listing trade type. */
export function tradeTypeFromManagePath(pathname: string): TradeType {
  if (matchPath({ path: ROUTES.TRADE_MANAGE_BUY_REQUESTS, end: true }, pathname)) return 'buy';
  if (matchPath({ path: ROUTES.TRADE_MANAGE_SELL, end: true }, pathname)) return 'sell';
  return pathname.includes('buy-requests') ? 'buy' : 'sell';
}

export function tradeListRoute(tradeType: TradeType): string {
  return tradeType === 'buy' ? ROUTES.TRADE_LIST_BUY : ROUTES.TRADE_LIST_SELL;
}
