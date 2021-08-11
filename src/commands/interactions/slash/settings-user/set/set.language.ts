import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';

import { Parameters } from '../../../../../utils';

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
  language: string,
}

export class SettingsUserSetLanguageCommand extends BaseCommandOption {
  description = 'Set your language for the bot.';
  name = 'language';

  constructor() {
    super({
      options: [
        {
          name: 'language',
          description: 'Language to choose from',
          required: true,
          choices: Parameters.Slash.GOOGLE_LOCALES,
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
