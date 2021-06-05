import { Slash } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedBrands, EmbedColors } from '../../../constants';

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
}

export class SettingsPrefixesListCommand extends BaseCommandOption {
  description = 'List the Server\'s Prefixes';
  name = 'list';

  async run(context: Slash.SlashContext, args: CommandArgs) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: 'wip',
      flags: 64,
    });
  }
}
