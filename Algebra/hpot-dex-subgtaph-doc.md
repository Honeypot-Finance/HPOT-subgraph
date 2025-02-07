# Hpot Dex Subgraph

## special terms

- `factory`: a factory is a contract that creates pools, also global variables are stored in the factory entity
- `whitelisted tokens`: tokens that are manually added to the platform by the hpot team, usually tokens with large market cap and high liquidity
- `untracked`: untracked means that the trade amount is not trading with our platform whitelisted tokens (e.g. Honey, USDC, etc.)

## navigation

- [Global Variables](#1-global-variables)
- [Token](#13-token)
  - [Account Holding Token](#30-holding-token)
- [Pool](#2-pool)
  - [Pool Hour Data](#3-pool-hour-data)
  - [Pool Day Data](#4-pool-day-data)
  - [Pool Week Data](#5-pool-week-data)
  - [Pool Month Data](#6-pool-month-data)
  - [Mints](#7-mints)
  - [Burns](#8-burns)
  - [Swaps](#9-swaps)
  - [Collects](#10-collects)
  - [Ticks](#11-ticks)
  - [Positions](#36-positions)
- [Vaults](#12-vaults)
  - [vault Shares](#14-vault-shares)
  - [vault Deposits](#15-vault-deposits)
  - [vault Withdraws](#16-vault-withdraws)
  - [vault Approvals](#17-vault-approvals)
  - [vault Affiliates](#18-vault-affiliates)
  - [vault Hysteresis](#19-vault-hysteresis)
  - [vault Collect Fees](#20-vault-collect-fees)
  - [Max Total Supply](#21-max-total-supply)
  - [Vault Ownership Transferred](#22-vault-ownership-transferred)
  - [Vault Rebalance](#23-vault-rebalance)
  - [Vault Set Twap Period](#24-vault-set-twap-period)
  - [Vault Transfer](#25-vault-transfer)
- [Pot2Pump](#26-pot2pump)
  - [Participant](#27-participant)
  - [Participant Transaction History](#28-participant-transaction-history)
  - [DepositRaisedToken](#35-deposit-raised-token)
  - [Refund](#33-refund)
  - [ClaimLp](#34-claimlp)
- [Account](#29-account)
  - [Account Holding Token](#30-holding-token)
- [Transaction](#31-transaction)
  - [Mint](#7-mints)
  - [Burn](#8-burns)
  - [Swap](#9-swaps)
  - [Collect](#10-collects)
  - [Flash](#11-flashes)
  - [Deposit](#15-vault-deposits)
  - [Withdraw](#16-vault-withdraws)
  - [DepositRaisedToken](#35-deposit-raised-token)
  - [Refund](#33-refund)
  - [ClaimLp](#34-claimlp)

## hightlited usage of queries

- [pot2pump newly launched](#pot2pump-newly-launched-query)
- [pot2pump near success launch](#pot2pump-near-success-query)
- [pot2pump trending launch](#pot2pump-trending-launch-query)
- [user active positions](#user-active-positions-query)
- [get pool by token pair](#get-pool-by-token-pair-query)
- [get account vault shares](#get-account-vault-shares-query)

## 1. Global Variables

global variables are stored in the `factory` entity.

### factory fields:

- `id`(string): the address of the factory
- `poolCount`(BigInt): the number of pools created by the factory
- `txCount`(BigInt): the number of transactions executed with hpot products
- `totalVolumeUSD`(BigDecimal): the total volume of the factory in USD
- `totalVolumeMatic`(BigDecimal): the total volume of the factory in Matic
- `totalFeesUSD`(BigDecimal): the total fees gained by the factory in USD
- `totalFeesMatic`(BigDecimal): the total fees gained by the factory in Matic
- `untrackedVolumeUSD`(BigDecimal): the untracked volume of the factory in USD
- `totalValueLockedUSD`(BigDecimal): the total value locked of the factory in USD
- `totalValueLockedMatic`(BigDecimal): the total value locked of the factory in Matic
- `accountCount`(BigInt): the number of accounts have interacted with hpot products

### example query to get global variables:

```graphql
query {
  factories {
    id
    poolCount
    txCount
    totalVolumeUSD
    totalVolumeMatic
    totalFeesUSD
    totalFeesMatic
    untrackedVolumeUSD
    totalValueLockedUSD
    totalValueLockedMatic
    accountCount
  }
}
```

## 2. Pool

### pool fields:

- `id`(string): the address of the pool
- [token0](#13-token0)(token entity): the entity of the first token in the pool
- [token1](#13-token1)(token entity): the entity of the second token in the pool
- `createdAtTimestamp`(BigInt): the timestamp of the pool creation
- `createdAtBlockNumber`(BigInt): the block number of the pool creation
- `plugin`(string): the address of the plugin of the pool
- `fee`(int): current fee percentage of the pool
- `liquidity`(BigDecimal): the liquidity of the pool
- `token0Price`(BigDecimal): the price of token0 in the pool
- `token1Price`(BigDecimal): the price of token1 in the pool
- `tick`(int): current tick of the pool
- `volumeToken0`(BigDecimal): the total volume of token0 in the pool
- `volumeToken1`(BigDecimal): the total volume of token1 in the pool
- `volumeUSD`(BigDecimal): the total volume of the pool in USD
- `untrackedVolumeUSD`(BigDecimal): the untracked volume of the pool in USD
- `feesUSD`(BigDecimal): the total fees gained by the pool in USD
- `tickSpacing`(int): the tick spacing of the pool
- `untrackedFeesUSD`(BigDecimal): the total untracked fees of the pool in USD
- `txCount`(BigInt): the number of transactions executed with the pool
- `collectedFeesToken0`(BigDecimal): the collected fees of token0 in the pool
- `collectedFeesToken1`(BigDecimal): the collected fees of token1 in the pool
- `collectedFeesUSD`(BigDecimal): the collected fees of the pool in USD
- `totalValueLockedToken0`(BigDecimal): the total value locked of token0 in the pool
- `totalValueLockedToken1`(BigDecimal): the total value locked of token1 in the pool
- `feesToken0`(BigDecimal): the fees of token0 gained by the pool
- `feesToken1`(BigDecimal): the fees of token1 gained by the pool
- `totalValueLockedMatic`(BigDecimal): the total value locked of the pool in Matic
- `totalValueLockedUSD`(BigDecimal): the total value locked of the pool in USD
- `totalValueLockedUSDUntracked`(BigDecimal): the total value locked of the pool in USD (untracked)
- `searchString`(string): the search string of the pool, combination of token0 and token1 symbols and pool address in lowercase
- `aprPercentage`(BigDecimal): the apr percentage of the pool(untracked)
- `liquidityProviderCount`(BigInt): the number of liquidity providers in the pool
- [vaults](#12-vaults)(vaults entity): the vaults entity of the pool
- `Time range data`:
  - [poolHourData](#3-pool-hour-data)( poolHourData entity): the hourly data entities of the pool
  - [poolDayData](#4-pool-day-data)(poolDayData entity): the daily data entities of the pool
  - [poolWeekData](#5-pool-week-data)(poolWeekData entity): the weekly data entities of the pool
  - [poolMonthData](#6-pool-month-data)(poolMonthData entity): the monthly data entities of the pool
- `events`:
  - [mints](#7-mints)(mints entity): the mints transaction entities of the pool
  - [burns](#8-burns)(burns entity): the burns transaction entities of the pool
  - [swaps](#9-swaps)(swaps entity): the swaps transaction entities of the pool
  - [collects](#10-collects)(collects entity): the collects transaction entities of the pool
  - [ticks](#11-ticks)(ticks entity): the ticks entities of the pool

### example query to get detailed pools data:

```graphql
query {
  pools {
    id
    token0 {
      id
      symbol
      name
      decimals
    }
    token1 {
      id
      symbol
      name
      decimals
    }
    fee
    liquidity
    token0Price
    token1Price
    tick
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    tickSpacing
    untrackedFeesUSD
    txCount
    collectedFeesToken0
    collectedFeesToken1
    collectedFeesUSD
    totalValueLockedToken0
    totalValueLockedToken1
    feesToken0
    feesToken1
    totalValueLockedMatic
    totalValueLockedUSD
    totalValueLockedUSDUntracked
    liquidityProviderCount
    poolHourData(orderBy: periodStartUnix, orderDirection: desc, first: 24) {
      id
      periodStartUnix
      volumeToken0
      volumeToken1
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      txCount
      aprPercentage
    }
    poolDayData(orderBy: date, orderDirection: desc, first: 7) {
      id
      date
      volumeToken0
      volumeToken1
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      txCount
      aprPercentage
    }
    poolWeekData(orderBy: week, orderDirection: desc, first: 4) {
      id
      week
      volumeToken0
      volumeToken1
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      txCount
      aprPercentage
    }
    poolMonthData(orderBy: month, orderDirection: desc, first: 12) {
      id
      month
      volumeToken0
      volumeToken1
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      txCount
      aprPercentage
    }
    mints(orderBy: timestamp, orderDirection: desc, first: 10) {
      id
      timestamp
      amount0
      amount1
      amountUSD
    }
    burns(orderBy: timestamp, orderDirection: desc, first: 10) {
      id
      timestamp
      amount0
      amount1
      amountUSD
    }
    swaps(orderBy: timestamp, orderDirection: desc, first: 10) {
      id
      timestamp
      amount0
      amount1
      amountUSD
      sender
      recipient
    }
  }
}
```

### get pool by token pair query

```graphql
# @param token0: token0 address
# @param token1: token1 address
query PoolsByTokenPair($token0: ID!, $token1: ID!) {
  pools(where: { token0_: { id: $token0 }, token1_: { id: $token1 } }) {
    ...PoolFields
  }
}
```

## 3. Pool Hour Data

### poolHourData fields:

- `id`(string): the id of the pool hour data
- `periodStartUnix`(BigInt): the timestamp of the pool hour data
- `volumeToken0`(BigInt): the volume of token0 in the pool hour data
- `volumeToken1`(BigInt): the volume of token1 in the pool hour data
- `volumeUSD`(BigInt): the volume of the pool in USD in the pool hour data
- `untrackedVolumeUSD`(BigInt): the untracked volume of the pool in USD in the pool hour data
- `feesUSD`(BigInt): the fees of the pool in USD in the pool hour data
- `txCount`(BigInt): the number of transactions executed with the pool in the pool hour data
- `aprPercentage`(BigDecimal): average apr of this pool hour data
- [pool](#2-pool)(entity): the pool entity of the pool hour data

### example query to get pool hour data:

```graphql
query {
  poolHourData(orderBy: periodStartUnix, orderDirection: desc, first: 24) {
    id
    periodStartUnix
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    txCount
    aprPercentage
  }
}
```

## 4. Pool Day Data

### poolDayData fields:

- `id`(string): the id of the pool day data
- `date`(BigInt): the timestamp of the pool day data
- `volumeToken0`(BigInt): the volume of token0 in the pool day data
- `volumeToken1`(BigInt): the volume of token1 in the pool day data
- `volumeUSD`(BigInt): the volume of the pool in USD in the pool day data
- `untrackedVolumeUSD`(BigInt): the untracked volume of the pool in USD in the pool day data
- `feesUSD`(BigInt): the fees of the pool in USD in the pool day data
- `txCount`(BigInt): the number of transactions executed with the pool in the pool day data
- `aprPercentage`(BigDecimal): average apr of this pool day data
- [pool](#2-pool)(pool entity): the pool entity of the pool day data

### example query to get pool day data:

```graphql
query {
  poolDayData(orderBy: date, orderDirection: desc, first: 7) {
    id
    date
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    txCount
    aprPercentage
  }
}
```

## 5. Pool Week Data

### poolWeekData fields:

- `id`(string): the id of the pool week data
- `week`(BigInt): the timestamp of the pool week data
- `volumeToken0`(BigInt): the volume of token0 in the pool week data
- `volumeToken1`(BigInt): the volume of token1 in the pool week data
- `volumeUSD`(BigInt): the volume of the pool in USD in the pool week data
- `untrackedVolumeUSD`(BigInt): the untracked volume of the pool in USD in the pool week data
- `feesUSD`(BigInt): the fees of the pool in USD in the pool week data
- `txCount`(BigInt): the number of transactions executed with the pool in the pool week data
- `aprPercentage`(BigDecimal): average apr of this pool week data
- [pool](#2-pool)(pool entity): the pool entity of the pool week data

### example query to get pool week data:

```graphql
query {
  poolWeekData(orderBy: week, orderDirection: desc, first: 4) {
    id
    week
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    txCount
    aprPercentage
  }
}
```

## 6. Pool Month Data

### poolMonthData fields:

- `id`(string): the id of the pool month data
- `month`(BigInt): the timestamp of the pool month data
- `volumeToken0`(BigInt): the volume of token0 in the pool month data
- `volumeToken1`(BigInt): the volume of token1 in the pool month data
- `volumeUSD`(BigInt): the volume of the pool in USD in the pool month data
- `untrackedVolumeUSD`(BigInt): the untracked volume of the pool in USD in the pool month data
- `feesUSD`(BigInt): the fees of the pool in USD in the pool month data
- `txCount`(BigInt): the number of transactions executed with the pool in the pool month data
- `aprPercentage`(BigDecimal): average apr of this pool month data
- [pool](#2-pool)(pool entity): the pool entity of the pool month data

### example query to get pool month data:

```graphql
query {
  poolMonthData(orderBy: month, orderDirection: desc, first: 12) {
    id
    month
    volumeToken0
    volumeToken1
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    txCount
    aprPercentage
  }
}
```

## 7. Mints

### mints fields:

- `id`(string): the id of the mint transaction
- [`transaction`](#31-transaction)(transaction entity): the transaction entity of the mint transaction
- `timestamp`(BigInt): the timestamp of the mint transaction
- [pool](#2-pool)(pool entity): the pool entity of the mint transaction
- `amount`(BigInt): liquidity minted
- `amount0`(BigDecimal): amount of token0 minted
- `amount1`(BigDecimal): amount of token1 minted
- `amountUSD`(BigDecimal): amount of liquidity minted in USD
- [token0](#13-token0)(token entity): the token0 entity of the pool
- [token1](#13-token1)(token entity): the token1 entity of the pool
- `tickLower`(int): the tick lower of the minted position
- `tickUpper`(int): the tick upper of the minted position
- `owner`(address): owner of the minted position
- `origin`(string): the EOA that initiated the txn

### example query to get mints:

```graphql
query {
  mints(orderBy: timestamp, orderDirection: desc, first: 10) {
    id
    timestamp
    amount0
    amount1
    amountUSD
  }
}
```

## 8. Burns

### burns fields:

- `id`(string): the id of the burn transaction
- [`transaction`](#31-transaction)(transaction entity): the transaction entity of the burn transaction
- `timestamp`(BigInt): the timestamp of the burn transaction
- [pool](#2-pool)(pool entity): the pool entity of the burn transaction
- `amount`(BigInt): liquidity burned
- `amount0`(BigDecimal): amount of token0 burned
- `amount1`(BigDecimal): amount of token1 burned
- `amountUSD`(BigDecimal): amount of liquidity burned in USD
- [token0](#13-token0)(token entity): the token0 entity of the pool
- [token1](#13-token1)(token entity): the token1 entity of the pool
- `tickLower`(int): the tick lower of the burned position
- `tickUpper`(int): the tick upper of the burned position
- `owner`(address): owner of the burned position
- `origin`(string): the EOA that initiated the txn

### example query to get burns:

```graphql
query {
  burns(orderBy: timestamp, orderDirection: desc, first: 10) {
    id
    timestamp
    amount0
    amount1
    amountUSD
  }
}
```

## 9. Swaps

### swaps fields:

- `id`(string): the id of the swap transaction
- [`transaction`](#31-transaction)(transaction entity): the transaction entity of the swap transaction
- `timestamp`(BigInt): the timestamp of the swap transaction
- [pool](#2-pool)(pool entity): the pool entity of the swap transaction
- `amount0`(BigDecimal): amount of token0 swapped
- `amount1`(BigDecimal): amount of token1 swapped
- `amountUSD`(BigDecimal): amount of liquidity swapped in USD
- [token0](#13-token0)(token entity): the token0 entity of the pool
- [token1](#13-token1)(token entity): the token1 entity of the pool
- `sender`(address): the sender of the swap transaction
- `recipient`(address): the recipient of the swap transaction

### example query to get swaps:

```graphql
query {
  swaps(orderBy: timestamp, orderDirection: desc, first: 10) {
    id
    timestamp
    amount0
    amount1
    amountUSD
  }
}
```

## 10. Collects

- `id`(string): the id of the collect transaction
- [`transaction`](#31-transaction)(transaction entity): the transaction entity of the collect transaction
- `timestamp`(BigInt): the timestamp of the collect transaction
- [pool](#2-pool)(pool entity): the pool entity of the collect transaction
- `amount0`(BigDecimal): amount of token0 collected
- `amount1`(BigDecimal): amount of token1 collected
- `amountUSD`(BigDecimal): amount of liquidity collected in USD
- [token0](#13-token0)(token entity): the token0 entity of the pool
- [token1](#13-token1)(token entity): the token1 entity of the pool
- `tickLower`(int): the tick lower of the collected position
- `tickUpper`(int): the tick upper of the collected position
- `owner`(address): owner of the collected position

### example query to get collects:

```graphql
query {
  collects(orderBy: timestamp, orderDirection: desc, first: 10) {
    id
    timestamp
    amount0
    amount1
    amountUSD
  }
}
```

## 11. Ticks

### tick fields:

- `id`(string): the id of the tick
- `poolAddress`(string): the address of the pool
- `tickIdx`(BigInt): the index of the tick
- [pool](#2-pool)(pool entity): the pool entity of the tick
- `liquidityGross`(BigInt): the gross liquidity of the tick
- `liquidityNet`(BigInt): the net liquidity of the tick
- `price0`(BigDecimal): the price of token0 in the tick
- `price1`(BigDecimal): the price of token1 in the tick

### example query to get ticks:

```graphql
query {
  ticks(orderBy: tickIdx, orderDirection: asc, first: 10) {
    id
    poolAddress
    tickIdx
    liquidityGross
    liquidityNet
    price0
    price1
  }
}
```

## 12. Vaults

the entity for vault is `ichiVault`, this is developed from by aquabera team

### vaults fields:

- `id`(string): the address of the vault
- `sender`(address): the sender of the vault
- `tokenA`(address): the address of the first token in the vault
- `allowTokenA`(boolean): whether the first token is allowed to deposit
- `tokenB`(address): the address of the second token in the vault
- `allowTokenB`(boolean): whether the second token is allowed to deposit
- `count`(BigInt): the number of vaults that have been created to date, can be see as index of this vault
- `holdersCount`(int): the number of holders have hold shares in this vault
- [pool](#2-pool)(pool entity): the pool entity of the vault
- `totalShares`(BigDecimal): the total number of shares in the vault, this could be used to calculate token amount and user amount
- `searchString`(string): the search string of the vault, combination of token0 and token1 symbols and pool address in lowercase
- `entities`: the entities of the vault
  - [vaultShares](#14-vault-shares)(vaultShares entity): the vault shares entity of the vault
  - [vaultDeposits](#15-vault-deposits)(vaultDeposits entity): the vault deposits entity of the vault
  - [vaultWithdraws](#16-vault-withdraws)(vaultWithdraws entity): the vault withdraws entity of the vault
  - [vaultApprovals](#17-vault-approvals)(vaultApprovals entity): the vault approvals entity of the vault
  - [vaultAffiliates](#18-vault-affiliates)(vaultAffiliates entity): the vault affiliates entity of the vault
  - [vaultHysteresis](#19-vault-hysteresis)(vaultHysteresis entity): the vault hysteresis entity of the vault
  - [vaultCollectFees](#20-vault-collect-fees)(vaultCollectFees entity): the vault collect fees entity of the vault
  - [maxTotalSupply](#21-max-total-supply)(maxTotalSupply entity): the max total supply entity of the vault
  - [vaultOwnershipTransferred](#22-vault-ownership-transferred)(vaultOwnershipTransferred entity): the vault ownership transferred entity of the vault
  - [vaultRebalance](#23-vault-rebalance)(vaultRebalance entity): the vault rebalance entity of the vault
  - [vaultSetTwapPeriod](#24-vault-set-twap-period)(vaultSetTwapPeriod entity): the vault set twap period entity of the vault
    - [vaultTransfer](#25-vault-transfer)(vaultTransfer entity): the vault transfer entity of the vault

### example query to get vaults:

```graphql
query {
  ichiVaults {
    id
    sender
    tokenA
    allowTokenA
    tokenB
    allowTokenB
    count
    holdersCount
    totalShares
    searchString
  }
}
```

## 13. Token

### token fields:

- `id`(string): the address of the token
- `symbol`(string): token symbol
- `name`(string): token name
- `decimals`(BigInt): token decimals
- `totalSupply`(BigInt): total supply of the token
- `volume`(BigDecimal): volume in token units
- `volumeUSD`(BigDecimal): volume in derived USD
- `untrackedVolumeUSD`(BigDecimal): volume in USD even on pools with less reliable USD values
- `feesUSD`(BigDecimal): fees in USD
- `txCount`(BigInt): transactions across all pools that include this token
- `poolCount`(BigInt): number of pools containing this token
- `totalValueLocked`(BigDecimal): liquidity across all pools in token units
- `totalValueLockedUSD`(BigDecimal): liquidity across all pools in derived USD
- `totalValueLockedUSDUntracked`(BigDecimal): TVL derived in USD untracked
- `derivedMatic`(BigDecimal): derived price in Matic
- `derivedUSD`(BigDecimal): derived price in USD
- `initialUSD`(BigDecimal): initial price in USD
- `priceChange24h`(BigDecimal): 24 hour price change
- `priceChange24hPercentage`(BigDecimal): 24 hour price change percentage
- [`whitelistPools`](#12-pool)(pool entity): pools token is in that are white listed for USD pricing
- `marketCap`(BigDecimal): derived market cap by total supply and derived price
- `holderCount`(BigInt): number of holders of this token
- `entities`:
  - [tokenHourData](#token-hour-data)(tokenHourData entity): hourly data for this token
  - [tokenDayData](#token-day-data)(tokenDayData entity): daily data for this token
  - [holders](#holding-token)(holders entity): holders of this token

### example query to get token data:

```graphql
query {
  tokens {
    id
    symbol
    name
    decimals
    totalSupply
    volume
    volumeUSD
    untrackedVolumeUSD
    feesUSD
    txCount
    poolCount
    totalValueLocked
    totalValueLockedUSD
    totalValueLockedUSDUntracked
    derivedMatic
    derivedUSD
    marketCap
    holderCount
  }
}
```

## 14. Vault Shares

### vaultShare fields:

- `id`(string): unique identifier for the vault share
- [`user`](#29-account)(account entity): the account that owns the shares
- [`vault`](#12-vaults)(vault entity): reference to the vault
- `vaultShareBalance`(BigDecimal): balance of shares owned by the user

### example query to get vault shares:

```graphql
query {
  vaultShares {
    id
    user {
      id
    }
    vault {
      id
    }
    vaultShareBalance
  }
}
```

### get account vault shares query

```graphql
# @param accountId: account address
query AccountVaultShares($AccountId: ID!) {
  vaultShares(where: { user_: { id: $AccountId }, vaultShareBalance_gt: 0 }) {
    ...VaultSharesField
    id
  }
}
```

## 15. Vault Deposits

### vaultDeposit fields:

- `id`(string): unique identifier for the deposit
- `vault`(IchiVault): reference to the vault
- `sender`(Bytes): address of the transaction signer
- `to`(Bytes): recipient address of the minted LP tokens
- `shares`(BigInt): quantity of LP tokens minted
- `amount0`(BigInt): amount of token0 deposited
- `amount1`(BigInt): amount of token1 deposited
- `tick`(Int): current price tick
- `createdAtTimestamp`(BigInt): timestamp of deposit
- `sqrtPrice`(BigInt): square root of price at deposit time
- `totalAmount0`(BigInt): total token0 in vault after deposit
- `totalAmount1`(BigInt): total token1 in vault after deposit
- `totalAmount0BeforeEvent`(BigInt): total token0 before deposit
- `totalAmount1BeforeEvent`(BigInt): total token1 before deposit
- `totalSupply`(BigInt): total supply of LP tokens

### example query to get vault deposits:

```graphql
query {
  vaultDeposits {
    id
    vault {
      id
    }
    sender
    shares
    amount0
    amount1
    createdAtTimestamp
  }
}
```

## 16. Vault Withdraws

### vaultWithdraw fields:

- `id`(string): unique identifier for the withdrawal
- `vault`(IchiVault): reference to the vault
- `sender`(Bytes): address of the transaction signer
- `to`(Bytes): recipient address of withdrawn tokens
- `shares`(BigInt): quantity of LP tokens burned
- `amount0`(BigInt): amount of token0 withdrawn
- `amount1`(BigInt): amount of token1 withdrawn
- `tick`(Int): current price tick
- `createdAtTimestamp`(BigInt): timestamp of withdrawal
- `sqrtPrice`(BigInt): square root of price at withdrawal time
- `totalAmount0`(BigInt): total token0 in vault after withdrawal
- `totalAmount1`(BigInt): total token1 in vault after withdrawal
- `totalAmount0BeforeEvent`(BigInt): total token0 before withdrawal
- `totalAmount1BeforeEvent`(BigInt): total token1 before withdrawal
- `totalSupply`(BigInt): total supply of LP tokens

### example query to get vault withdrawals:

```graphql
query {
  vaultWithdraws {
    id
    vault {
      id
    }
    sender
    shares
    amount0
    amount1
    createdAtTimestamp
  }
}
```

## 17. Vault Approvals

### vaultApproval fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `owner`(Bytes): address of the owner of the spender account
- `spender`(Bytes): address for which the allowance is being set
- `value`(BigInt): the new allowance amount

### example query to get vault approvals:

```graphql
query {
  vaultApprovals {
    id
    vault {
      id
    }
    owner
    spender
    value
  }
}
```

## 18. Vault Affiliates

### vaultAffiliate fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `sender`(Bytes): address of the transaction signer
- `affiliate`(Bytes): address of the new affiliate that will receive trading fee split

### example query to get vault affiliates:

```graphql
query {
  vaultAffiliates {
    id
    vault {
      id
    }
    sender
    affiliate
  }
}
```

## 19. Vault Hysteresis

### vaultHysteresis fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `sender`(Bytes): address of the transaction signer
- `hysteresis`(BigInt): new hysteresis threshold in percentage

### example query to get vault hysteresis:

```graphql
query {
  vaultHysteresis {
    id
    vault {
      id
    }
    sender
    hysteresis
  }
}
```

## 20. Vault Collect Fees

### vaultCollectFee fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `sender`(Bytes): address of the CollectFees transaction signer
- `tick`(Int): current price tick
- `createdAtTimestamp`(BigInt): timestamp of fee collection
- `sqrtPrice`(BigInt): square root price at collection time
- `feeAmount0`(BigInt): collected fee amount of token0
- `feeAmount1`(BigInt): collected fee amount of token1
- `totalAmount0`(BigInt): total token0 in vault after collection
- `totalAmount1`(BigInt): total token1 in vault after collection
- `totalSupply`(BigInt): total supply of LP tokens

### example query to get vault collect fees:

```graphql
query {
  vaultCollectFees {
    id
    vault {
      id
    }
    sender
    feeAmount0
    feeAmount1
    createdAtTimestamp
  }
}
```

## 21. Max Total Supply

### maxTotalSupply fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `totalSupply`(BigInt): total supply of LP tokens

### example query to get max total supply:

```graphql
query {
  maxTotalSupply {
    id
    vault {
      id
    }
    totalSupply
  }
}
```

## 22. Vault Ownership Transferred

### vaultOwnershipTransferred fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `from`(Bytes): address of the previous owner
- `to`(Bytes): address of the new owner

### example query to get vault ownership transferred:

```graphql
query {
  vaultOwnershipTransferred {
    id
    vault {
      id
    }
    from
    to
  }
}
```

## 23. Vault Rebalance

### vaultRebalance fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `sender`(Bytes): address of the transaction signer
- `amount0`(BigInt): amount of token0 to be rebalanced
- `amount1`(BigInt): amount of token1 to be rebalanced

### example query to get vault rebalance:

```graphql
query {
  vaultRebalance {
    id
    vault {
      id
    }
    sender
    amount0
    amount1
  }
}
```

## 24. Vault Set Twap Period

### vaultSetTwapPeriod fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `sender`(Bytes): address of the transaction signer
- `twapPeriod`(BigInt): new twap period in seconds

### example query to get vault set twap period:

```graphql
query {
  vaultSetTwapPeriod {
    id
    vault {
      id
    }
    sender
    twapPeriod
  }
}
```

## 25. Vault Transfer

### vaultTransfer fields:

- `id`(string): unique identifier (transaction hash + log index)
- `vault`(IchiVault): reference to the vault
- `sender`(Bytes): address of the transaction signer
- `to`(Bytes): address of the recipient
- `amount0`(BigInt): amount of token0 to be transferred
- `amount1`(BigInt): amount of token1 to be transferred

### example query to get vault transfer:

```graphql
query {
  vaultTransfer {
    id
    vault {
      id
    }
    sender
    to
    amount0
    amount1
  }
}
```

## 26. Pot2Pump

### pot2Pump fields:

- `id`(string): token address
- `launchTokenInitialPrice`(BigDecimal): initial price of the launch token
- [`launchToken`](#27-token)(entity): reference to the token being launched
- `DepositLaunchToken`(BigInt): amount of launch tokens deposited
- `LaunchTokenTVLUSD`(BigDecimal): total value locked in USD for launch token
- `LaunchTokenMCAPUSD`(BigDecimal): market cap in USD for launch token
- `raisedTokenMinCap`(BigInt): minimum cap for the raised token
- [`raisedToken`](#27-token)(entity): reference to the token being raised
- `depositRaisedTokenPercentageToMinCap`(BigDecimal): percentage of raised token deposited compared to min cap
- `raisedTokenReachingMinCap`(Boolean): whether raised token reached minimum cap
- `DepositRaisedToken`(BigInt): amount of raised tokens deposited
- `creator`(String): address of the creator
- `participantsCount`(BigInt): number of participants
- `totalRefundAmount`(BigInt): total amount refunded
- `totalClaimLpAmount`(BigInt): total amount of LP tokens claimed
- `createdAt`(BigInt): timestamp of creation
- `endTime`(BigInt): timestamp of end time
- `state`(BigInt): current state of the Pot2Pump
- `buyCount`(BigInt): number of buy transactions
- `sellCount`(BigInt): number of sell transactions
- `searchString`(String): searchable string combining address and token symbols

### example query to get pot2pump data:

```graphql
query {
  pot2Pumps {
    id
    launchTokenInitialPrice
    launchToken {
      symbol
      name
    }
    DepositLaunchToken
    LaunchTokenTVLUSD
    LaunchTokenMCAPUSD
    raisedTokenMinCap
    raisedToken {
      symbol
      name
    }
    depositRaisedTokenPercentageToMinCap
    raisedTokenReachingMinCap
    DepositRaisedToken
    creator
    participantsCount
    totalRefundAmount
    totalClaimLpAmount
    createdAt
    endTime
    state
    buyCount
    sellCount
  }
}
```

### pot2pump newly launched query:

```graphql
# @param endTime: BigInt - timestamp of the current time
query Pot2PumpPottingNewTokens($endTime: BigInt) {
  pot2Pumps(
    first: 25
    orderBy: createdAt
    orderDirection: desc
    where: { raisedTokenReachingMinCap: false, endTime_gt: $endTime }
  ) {
    id
    launchToken {
      symbol
    }
    raisedToken {
      symbol
    }
  }
}
```

### pot2pump near success query:

```graphql
# @param endTime: BigInt - timestamp of the current time
query Pot2PumpPottingNearSuccess($endTime: BigInt) {
  pot2Pumps(
    first: 25
    orderBy: depositRaisedTokenPercentageToMinCap
    orderDirection: desc
    where: { raisedTokenReachingMinCap: false, endTime_gt: $endTime }
  ) {
    id
    launchToken {
      symbol
    }
    raisedToken {
      symbol
    }
  }
}
```

### pot2pump trending launch query:

```graphql
query Pot2PumpPottingTrending {
  pot2Pumps(
    first: 25
    orderBy: launchToken__priceChange24hPercentage
    orderDirection: desc
    where: { raisedTokenReachingMinCap: true }
  ) {
    ...Pot2PumpField
  }
}
```

## 27. Participant

### participant fields:

- `id`(string): unique identifier
- `pot2Pump`(Pot2Pump): reference to the Pot2Pump
- `account`(Account): reference to the participant's account
- `amount`(BigInt): total deposit amount
- `totalRefundAmount`(BigInt): total amount refunded
- `totalclaimLqAmount`(BigInt): total amount of LP claimed (1 means claimed all, 0 means none)
- `claimed`(Boolean): whether participant has claimed
- `refunded`(Boolean): whether participant has been refunded
- `createdAt`(BigInt): timestamp of participation
- [`participantTransactionHistorys`](#28-participant-transaction-history)(entity): history of participant's transactions

### example query to get participant data:

```graphql
query {
  participants {
    id
    pot2Pump {
      id
      launchToken {
        symbol
      }
    }
    account {
      id
    }
    amount
    totalRefundAmount
    totalclaimLqAmount
    claimed
    refunded
    createdAt
  }
}
```

## 28. Participant Transaction History

### participantTransactionHistory fields:

- `id`(string): unique identifier
- [`account`](#29-account)(entity): reference to the participant's account
- [`pot2Pump`](#26-pot2pump)(entity): reference to the Pot2Pump
- `depositAmount`(BigInt): amount deposited in transaction
- `refundAmount`(BigInt): amount refunded in transaction
- `claimLqAmount`(BigInt): amount of LP claimed in transaction (1 means all, 0 means none)
- `actionType`(TransactionType): type of transaction
- `createdAt`(BigInt): timestamp of transaction
- [`participant`](#27-participant)(entity): reference to the participant

### example query to get transaction history:

```graphql
query {
  participantTransactionHistories {
    id
    account {
      id
    }
    pot2Pump {
      id
      launchToken {
        symbol
      }
    }
    depositAmount
    refundAmount
    claimLqAmount
    actionType
    createdAt
  }
}
```

## 29. Account

### account fields:

- `id`(string): account address
- `memeTokenHoldingCount`(BigInt): number of meme tokens held by this account
- [`holder`](#30-holding-token)(holdingToken entity): list of tokens held by this account
- `pot2PumpLaunchCount`(BigInt): number of Pot2Pump launches by this account
- `participateCount`(BigInt): number of Pot2Pump participations
- [`participant`](#27-participant)(entity): list of Pot2Pump participations
- [`transaction`](#31-transaction)(transaction entity): list of transactions made by this account
- `platformTxCount`(BigInt): total number of transactions on the platform
- `swapCount`(BigInt): number of swap transactions
- `holdingPoolCount`(BigInt): number of pools the account has holdings in
- `totalSpendUSD`(BigDecimal): total amount spent in USD
- [`vaultShares`](#14-vault-shares)(vaultShare entity): list of vault shares owned by this account

### example query to get account data:

```graphql
query {
  accounts {
    id
    memeTokenHoldingCount
    pot2PumpLaunchCount
    participateCount
    platformTxCount
    swapCount
    holdingPoolCount
    totalSpendUSD
    holder {
      token {
        symbol
        name
      }
      holdingValue
    }
    participant {
      pot2Pump {
        id
      }
      amount
    }
    vaultShares {
      vault {
        id
      }
      vaultShareBalance
    }
  }
}
```

## 30. Holding Token

### holdingToken fields:

- `id`(string): account address + token address
- [`token`](#13-token)(entity): reference to the token being held
- [`account`](#29-account)(entity): reference to the account holding the token
- `holdingValue`(BigInt): amount of tokens held

### example query to get holding token data:

```graphql
query {
  holdingTokens {
    id
    token {
      symbol
      name
      decimals
    }
    account {
      id
    }
    holdingValue
  }
}
```

## 31. Transaction

### transaction fields:

- `id`(string): transaction hash
- `type`(TransactionType): type of transaction (DEPOSIT, REFUND, CLAIM_LP, SWAP, COLLECT, MINT, BURN, INCREASE_LIQUIDITY, DECREASE_LIQUIDITY)
- [`account`](#29-account)(entity): reference to the account that made the transaction
- `blockNumber`(BigInt): block number of the transaction
- `timestamp`(BigInt): timestamp of the transaction
- `gasLimit`(BigInt): gas limit of the transaction
- `gasPrice`(BigInt): gas price of the transaction
- events
  - [`mints`](#7-mints) (Mint entity): list of mint events in this transaction
  - [`burns`](#8-burns) (Burn entity): list of burn events in this transaction
  - [`swaps`](#9-swaps) (Swap entity): list of swap events in this transaction
  - [`flashed`](#32-flash) (Flash entity): list of flash events in this transaction
  - [`collects`](#10-collects) (Collect entity): list of collect events in this transaction
  - [`depositRaisedTokens`](#35-deposit-raised-token) (DepositRaisedToken entity): list of deposit raised token events
  - [`refunds`](#33-refund) (Refund entity): list of refund events
  - [`claimLps`](#34-claimlp) (ClaimLp entity): list of claim LP events

### example query to get transaction data:

```graphql
query {
  transactions {
    id
    type
    account {
      id
    }
    blockNumber
    timestamp
    gasLimit
    gasPrice
    swaps {
      amount0
      amount1
      amountUSD
    }
    mints {
      amount0
      amount1
      amountUSD
    }
    burns {
      amount0
      amount1
      amountUSD
    }
  }
}
```

## 32. Flash

### flash fields:

- `id`(string): transaction hash + index
- [`transaction`](#31-transaction)(transaction entity): reference to the transaction
- `timestamp`(BigInt): timestamp of the flash event
- `pool`(Pool): reference to the pool
- `sender`(Bytes): address of the sender
- `recipient`(Bytes): address of the recipient
- `amount0`(BigDecimal): amount of token0 flashed
- `amount1`(BigDecimal): amount of token1 flashed
- `amountUSD`(BigDecimal): total amount in USD
- `amount0Paid`(BigDecimal): amount of token0 paid for flash
- `amount1Paid`(BigDecimal): amount of token1 paid for flash
- `logIndex`(BigInt): index in the transaction

### example query to get flash data:

```graphql
query {
  flashes {
    id
    timestamp
    pool {
      id
    }
    sender
    recipient
    amount0
    amount1
    amountUSD
    amount0Paid
    amount1Paid
  }
}
```

## 33. Refund

### refund fields:

- `id`(string): unique identifier (transaction hash + index)
- [`transaction`](#31-transaction)(entity): reference to the transaction
- `timestamp`(BigInt): timestamp of the refund
- `amount`(BigInt): amount being refunded
- `origin`(Bytes): the EOA that initiated the transaction
- `logIndex`(BigInt): index in the transaction
- `poolAddress`(Bytes): address of the pool where refund occurred

### example query to get refund data:

```graphql
query {
  refunds {
    id
    transaction {
      id
    }
    timestamp
    amount
    origin
    poolAddress
  }
}
```

## 34. ClaimLp

### claimLp fields:

- `id`(string): unique identifier (transaction hash + index)
- [`transaction`](#31-transaction)(entity): reference to the transaction
- `timestamp`(BigInt): timestamp of the LP claim
- `amount`(BigInt): amount of LP tokens claimed
- `origin`(Bytes): the EOA that initiated the transaction
- `logIndex`(BigInt): index in the transaction
- `poolAddress`(Bytes): address of the pool where LP was claimed

### example query to get claim LP data:

```graphql
query {
  claimLps {
    id
    transaction {
      id
    }
    timestamp
    amount
    origin
    poolAddress
  }
}
```

## 35. Deposit Raised Token

### depositRaisedToken fields:

- `id`(string): unique identifier (transaction hash + index)
- [`transaction`](#31-transaction)(entity): reference to the transaction
- `timestamp`(BigInt): timestamp of the deposit raised token event
- `amount`(BigInt): amount of tokens deposited
- `logIndex`(BigInt): index in the transaction
- `poolAddress`(Bytes): address of the pool where deposit occurred

### example query to get deposit raised token data:

```graphql
query {
  depositRaisedTokens {
    id
    transaction {
      id
    }
    timestamp
    amount
    poolAddress
  }
}
```

## 36. positions

### position fields:

- `id`(string): unique identifier (transaction hash + index)
- `owner`(Bytes): address of the owner
- [`pool`](#2-pool)(pool entity): reference to the pool
- [`token0`](#13-token)(token entity): reference to the token0
- [`token1`](#13-token)(token entity): reference to the token1
- `liquidity`(BigInt): liquidity of the position
- `depositedToken0`(BigInt): amount of token0 deposited
- `depositedToken1`(BigInt): amount of token1 deposited
- `withdrawnToken0`(BigInt): amount of token0 withdrawn
- `withdrawnToken1`(BigInt): amount of token1 withdrawn

### example query to get position data:

```graphql
query {
  positions {
    id
    owner
    pool {
      id
    }
    token0 {
      symbol
      name
      decimals
    }
    token1 {
      symbol
      name
      decimals
    }
    liquidity
    depositedToken0
    depositedToken1
    withdrawnToken0
    withdrawnToken1
  }
}
```

### user active positions query

```graphql
# @param account: account address
query UserActivePositions($account: Bytes!) {
  positions(where: { owner: $account, liquidity_gt: 0 }) {
    ...PositionFields
  }
}
```
