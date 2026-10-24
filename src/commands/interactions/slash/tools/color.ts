import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class ToolsColorCommand extends BaseInteractionCommandOption {
  description = 'Show a color\'s hex, RGB, HSL, closest name and more';
  descriptionLocalizations = I18n.localizations('commands.tools.color.description');
  metadata = {
    id: Formatter.Commands.ToolsColor.COMMAND_ID,
  };
  name = 'color';
  nameLocalizations = I18n.localizations('commands.tools.color.name');

  constructor() {
    super({
      options: [
        {
          name: 'color',
          description: 'Hex, RGB, HSL, a color name or random (Default: random)',
          ...I18n.optionLocalizations('commands.tools.color.color'),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsColor.CommandArgs) {
    return Formatter.Commands.ToolsColor.createMessage(context, args);
  }
}
