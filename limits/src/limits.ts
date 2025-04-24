import { config } from '../config/ethereum';
import { LimitCreated, LimitFilled, LimitCancelled } from './generated/Limits/Limits';
import { Limit, Order } from './generated/schema';

export function handleLimitCreated(event: LimitCreated): void {
  const limit = new Limit(event.params.limitId.toString());
  limit.owner = event.params.owner;
  limit.token = event.params.token;
  limit.amount = event.params.amount;
  limit.price = event.params.price;
  limit.isBuy = event.params.isBuy;
  limit.status = 'OPEN';
  limit.createdAt = event.block.timestamp;
  limit.save();
}

export function handleLimitFilled(event: LimitFilled): void {
  const limit = Limit.load(event.params.limitId.toString());
  if (!limit) return;

  const order = new Order(event.transaction.hash.toHex());
  order.limit = limit.id;
  order.amount = event.params.amount;
  order.price = event.params.price;
  order.timestamp = event.block.timestamp;
  order.save();

  limit.amount = limit.amount.minus(event.params.amount);
  if (limit.amount.equals(0)) {
    limit.status = 'FILLED';
  }
  limit.save();
}

export function handleLimitCancelled(event: LimitCancelled): void {
  const limit = Limit.load(event.params.limitId.toString());
  if (!limit) return;

  limit.status = 'CANCELLED';
  limit.save();
} 