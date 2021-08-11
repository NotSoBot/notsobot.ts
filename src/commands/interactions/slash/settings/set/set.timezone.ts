import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { EmbedBrands, EmbedColors } from '../../../../../constants';

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
  timezone: string,
}

export class SettingsSetTimezoneCommand extends BaseCommandOption {
  description = 'Set the Server\'s Timezone';
  name = 'timezone';

  constructor() {
    super({
      options: [
        {
          name: 'timezone',
          description: 'Timezone to choose from',
          required: true,
          choices: [{name: 'Test', value: 'a'}],
        },
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
