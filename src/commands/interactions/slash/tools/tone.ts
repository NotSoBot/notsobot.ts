import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
} from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  text: string,
}

export const COMMAND_NAME = 'tone';

export class ToolsToneCommand extends BaseInteractionCommandOption {
  description = 'Score how toxic, insulting, threatening or obscene text is';
  descriptionLocalizations = I18n.localizations('commands.tools.tone.description');
  metadata = {
    id: Formatter.Commands.ToolsTone.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.tone.name');

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
        // the api takes up to 4000 characters
        {name: 'text', description: 'Text to score', ...I18n.optionLocalizations('commands.tools.tone.text'), maxLength: 4000, value: Parameters.parsedMentionsText, required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ToolsTone.createMessage(context, args);
  }
}
