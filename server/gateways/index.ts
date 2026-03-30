import { MyFatoorahGateway } from './myfatoorah.js';
import { ThuwaniGateway } from './thuwani.js';
import { AmwalPayGateway } from './amwalpay.js';
import type { PaymentGateway } from './types.js';

export type GatewayId = 'myfatoorah' | 'thuwani' | 'amwalpay';

const registry: Record<GatewayId, PaymentGateway> = {
  myfatoorah: new MyFatoorahGateway(),
  thuwani: new ThuwaniGateway(),
  amwalpay: new AmwalPayGateway(),
};

export function getGateway(id: GatewayId): PaymentGateway {
  const gw = registry[id];
  if (!gw) throw new Error(`Unknown payment gateway: ${id}`);
  return gw;
}

export function allGatewayIds(): GatewayId[] {
  return Object.keys(registry) as GatewayId[];
}

export type { PaymentGateway };
