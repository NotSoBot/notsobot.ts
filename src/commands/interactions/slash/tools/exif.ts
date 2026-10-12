import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'exif';

export class ToolsExifCommand extends BaseInteractionMediaCommandOption {
  description = 'Get exif information from a Media File';
  descriptionLocalizations = I18n.localizations('commands.tools.exif.description');
  metadata = {
    id: Formatter.Commands.ToolsExif.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.exif.name');

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsExif.CommandArgs) {
    return Formatter.Commands.ToolsExif.createMessage(context, args);
  }
}
