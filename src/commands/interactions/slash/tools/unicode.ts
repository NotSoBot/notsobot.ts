import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ToolsUnicodeCommand extends BaseInteractionCommandOption {
  description = 'Show the Unicode name and code point of each character';
  descriptionLocalizations = I18n.localizations('commands.tools.unicode.description');
  metadata = {
    id: Formatter.Commands.ToolsUnicode.COMMAND_ID,
  };
  name = 'unicode';
  nameLocalizations = I18n.localizations('commands.tools.unicode.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Text to look up',
          ...I18n.optionLocalizations('commands.tools.unicode.text'),
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsUnicode.CommandArgs) {
    return Formatter.Commands.ToolsUnicode.createMessage(context, args);
  }
}
