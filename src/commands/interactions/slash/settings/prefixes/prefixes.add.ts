import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes, Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedBrands, EmbedColors } from '../../../../../constants';

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
  prefix: string,
}

export class SettingsPrefixesAddCommand extends BaseCommandOption {
  description = 'Add a custom prefix for this Server';
  name = 'add';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'prefix', description: 'Prefix to add', required: true},
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
