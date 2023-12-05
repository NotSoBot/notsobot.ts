import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  language: GoogleLocales,
}

export class SettingsSetLocaleCommand extends BaseInteractionCommandOption {
  description = 'Set your default language for the bot.';
  metadata = {
    id: Formatter.Commands.SettingsSetLocale.COMMAND_ID,
  };
  name = 'locale';

  constructor() {
    super({
      options: [
        {
          name: 'language',
          description: 'Language',
          required: true,
          value: Parameters.locale,
          onAutoComplete: Parameters.AutoComplete.googleLocales,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.language;
  }

  onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return editOrReply(context, {
      content: '⚠ Give me some sort of language to set!',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.SettingsSetLocale.createMessage(context, {locale: args.language});
  }
}
