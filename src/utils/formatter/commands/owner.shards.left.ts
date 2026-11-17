import { Command, Interaction } from 'detritus-client';
import { MarkupTimestampStyles } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { getTranslator } from '../../i18n';
import { displayReply } from '../../../utils';


export interface CommandArgs {

}


export const COMMAND_ID = 'owner.shards.left';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { language, translate } = await getTranslator(context);
  const { session_start_limit: sessionStartLimit } = await context.rest.fetchGatewayBot();

  const resetsAt = Date.now() + sessionStartLimit.reset_after;
  return displayReply(context, {description: [
    translate('owner_shards_left.we_have_identifies_left_out_of', {remaining: sessionStartLimit.remaining.toLocaleString(language), total: sessionStartLimit.total.toLocaleString(language)}),
    translate('owner_shards_left.it_resets', {
      timestamp: Markup.timestamp(resetsAt, MarkupTimestampStyles.RELATIVE),
      timestamp2: Markup.timestamp(resetsAt, MarkupTimestampStyles.BOTH_SHORT),
    }),
  ].join('\n')});
}
