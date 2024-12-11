import { ICHIVaultCreated } from "./types/ICHIVaultFactory/ICHIVaultFactory";
import { IchiVault } from "./types/schema";
import { Vault } from "./types/templates";

export function handleICHIVaultCreated(event: ICHIVaultCreated): void {
  const ichiVault = new IchiVault(event.params.ichiVault.toHexString());
  ichiVault.sender = event.params.sender;
  ichiVault.tokenA = event.params.tokenA;
  ichiVault.allowTokenA = event.params.allowTokenA;
  ichiVault.tokenB = event.params.tokenB;
  ichiVault.allowTokenB = event.params.allowTokenB;
  ichiVault.count = event.params.count;
  ichiVault.createdAtTimestamp = event.block.timestamp;
  ichiVault.holdersCount = 0;
  ichiVault.save();
  Vault.create(event.params.ichiVault);
}
