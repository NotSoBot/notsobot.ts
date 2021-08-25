import { Interaction } from 'detritus-client';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, Parameters } from '../../../../../utils';

import { BaseCommandOption } from '../../basecommand';


export interface CommandArgs {
  language: GoogleLocales,
}

export class SettingsUserSetLocaleCommand extends BaseCommandOption {
  description = 'Set your default language for the bot.';
  name = 'locale';

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
    return Formatter.Commands.SettingsMeLocale.createMessage(context, {locale: args.language});
  }
}
