import { Interaction } from 'detritus-client';
import {
  ApplicationCommandOptionTypes,
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  from: GoogleLocales | null,
  text: string,
  to: GoogleLocales | null,
  toChoice: GoogleLocales | null,
}

export const COMMAND_NAME = 'translate';

export class ToolsTranslateCommand extends BaseInteractionCommandOption {
  description = 'Translate some text';
  descriptionLocalizations = I18n.localizations('commands.tools.translate.description');
  metadata = {
    id: Formatter.Commands.ToolsTranslate.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.translate.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        {name: 'text', description: 'Text to translate', ...I18n.optionLocalizations('commands.tools.translate.text'), value: Parameters.parsedMentionsText, required: true},
        {name: 'to', description: 'Language to translate to', ...I18n.optionLocalizations('commands.tools.translate.to'), value: Parameters.locale},
        {name: 'to-choices', description: 'Language to translate to (Choices)', ...I18n.optionLocalizations('commands.tools.translate.to-choices'), choices: Parameters.Slash.GOOGLE_LOCALES, label: 'toChoice'},
        {name: 'from', description: 'Language to translate from', ...I18n.optionLocalizations('commands.tools.translate.from'), choices: Parameters.Slash.GOOGLE_LOCALES},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const to = args.to || args.toChoice || await DefaultParameters.locale(context);
    return Formatter.Commands.ToolsTranslate.createMessage(context, {
      from: args.from,
      to,
      text: args.text,
    });
  }
}
