import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ascii-from-text';

export class AsciiFromTextCommand extends BaseInteractionCommandOption {
  description = 'Convert text to an ASCII Image';
  descriptionLocalizations = I18n.localizations('commands.fun.ascii_from_text.description');
  metadata = {
    id: Formatter.Commands.FunAsciiFromText.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.ascii_from_text.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to turn into ASCII Art',
          ...I18n.optionLocalizations('commands.fun.ascii_from_text.text'),
          value: Parameters.parsedMentionsText,
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FunAsciiFromText.CommandArgs) {
    return Formatter.Commands.FunAsciiFromText.createMessage(context, args);
  }
}
