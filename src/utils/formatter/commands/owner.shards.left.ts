import { Command, Interaction } from 'detritus-client';

import { DateMomentLogFormat } from '../../../constants';
import { createTimestampMomentFromGuild, editOrReply } from '../../../utils';


export interface CommandArgs {

}


export const COMMAND_ID = 'shardsleft';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { session_start_limit: sessionStartLimit } = await context.rest.fetchGatewayBot();

  const timestamp = createTimestampMomentFromGuild(Date.now() + sessionStartLimit.reset_after, context.guildId);
  return editOrReply(context, [
    `We have ${sessionStartLimit.remaining.toLocaleString()} identifies left out of ${sessionStartLimit.total.toLocaleString()}`,
    `It resets ${timestamp.fromNow()} @ ${timestamp.format(DateMomentLogFormat)}`,
  ].join('\n'));
}
