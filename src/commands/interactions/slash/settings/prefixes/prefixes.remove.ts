import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedBrands, EmbedColors } from '../../../../../constants';

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
  prefix: string,
}

export class SettingsPrefixesRemoveCommand extends BaseCommandOption {
  description = 'Remove a custom prefix on this Server';
  name = 'remove';

  constructor() {
    super({
      options: [
        {name: 'prefix', description: 'Prefix to remove', required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: 'wip',
      flags: 64,
    });
  }
}
