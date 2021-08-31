import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  language?: GoogleLocales,
  languageChoice?: GoogleLocales,
}

export class SettingsUserSetLocaleCommand extends BaseInteractionCommandOption {
  description = 'Set your default language for the bot.';
  name = 'locale';

  constructor() {
    super({
      options: [
        {name: 'language', description: 'Language', value: Parameters.locale},
        {name: 'language-choices', description: 'Language to choose from', choices: Parameters.Slash.GOOGLE_LOCALES, label: 'languageChoice'},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!(args.language || args.languageChoice);
  }

  onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return editOrReply(context, {
      content: '⚠ Give me some sort of language to set!',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SettingsMeLocale.createMessage(context, {locale: (args.language || args.languageChoice)!});
  }
}
