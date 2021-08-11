import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from './basecommand';


export interface CommandArgs {
  from: GoogleLocales | null,
  text: string,
  to: GoogleLocales | null,
}

export const COMMAND_NAME = 'translate';

export default class TranslateCommand extends BaseCommand {
  description = 'Translate some text';
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'text', type: ApplicationCommandOptionTypes.STRING, description: 'Text to translate', required: true},
        {name: 'to', type: ApplicationCommandOptionTypes.STRING, description: 'Language to translate to', choices: Parameters.Slash.GOOGLE_LOCALES},
        {name: 'from', type: ApplicationCommandOptionTypes.STRING, description: 'Language to translate from', choices: Parameters.Slash.GOOGLE_LOCALES},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ToolsTranslate.createMessage(context, args);
  }
}
