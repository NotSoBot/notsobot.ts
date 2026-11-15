import { Interaction } from 'detritus-client';

import { MediaSSTVModes, MediaSSTVModesToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'sstv';

export class ToolsSSTVCommand extends BaseInteractionImageCommandOption {
  description = 'Turn an Image into a slow-scan TV signal that SSTV decoder apps can read';
  descriptionLocalizations = I18n.localizations('commands.tools.sstv.description');
  metadata = {
    id: Formatter.Commands.MediaIVToolsSSTV.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.sstv.name');

  constructor() {
    super({
      options: [
        {
          name: 'mode',
          description: `SSTV mode, Robot 36 is the shortest (Default: ${MediaSSTVModesToText[MediaSSTVModes.MARTIN_1]})`,
          ...I18n.optionLocalizations('commands.tools.sstv.mode'),
          choices: Parameters.Slash.oneOf({
            choices: MediaSSTVModes,
            descriptions: MediaSSTVModesToText,
            defaultChoice: MediaSSTVModes.MARTIN_1,
            doNotSort: true,
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsSSTV.CommandArgs) {
    return Formatter.Commands.MediaIVToolsSSTV.createMessage(context, args);
  }
}
