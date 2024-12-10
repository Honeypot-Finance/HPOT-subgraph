import { ADDRESS_ZERO } from "./constants";

export const isNotZeroAddress = (address: string): boolean => address !== ADDRESS_ZERO

export const isZeroAddress = (address: string): boolean => address == ADDRESS_ZERO