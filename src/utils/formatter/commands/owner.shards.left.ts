import { Command, Interaction } from 'detritus-client';

import { DateMomentLogFormat } from '../../../constants';
import { getTranslator } from '../../i18n';
import { createTimestampMomentFromGuild, displayReply } from '../../../utils';


export interface CommandArgs {

}


export const COMMAND_ID = 'shardsleft';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { session_start_limit: sessionStartLimit } = await context.rest.fetchGatewayBot();

  const timestamp = createTimestampMomentFromGuild(Date.now() + sessionStartLimit.reset_after, context.guildId);
  return displayReply(context, {description: [
    translate('owner_shards_left.we_have_identifies_left_out_of', {remaining: sessionStartLimit.remaining.toLocaleString(language), total: sessionStartLimit.total.toLocaleString(language)}),
    translate('owner_shards_left.it_resets', {timestamp: timestamp.locale(language).fromNow(), timestamp2: timestamp.format(DateMomentLogFormat)}),
  ].join('\n')});
}
