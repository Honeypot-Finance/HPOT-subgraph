import { Counter } from '@sentio/sdk'
import { ERC20Processor } from '@sentio/sdk/eth/builtin'

const tokenCounter = Counter.register('token')

const address = '0x4200000000000000000000000000000000000006'

ERC20Processor.bind({ address }).onEventTransfer(async (event, ctx) => {
  const val = event.args.value.scaleDown(18)
  tokenCounter.add(ctx, val)
})
