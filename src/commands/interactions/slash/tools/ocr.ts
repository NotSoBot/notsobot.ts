import { Interaction } from 'detritus-client';

import { CommandRatelimits } from '../../../../constants';
import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ocr';

export class ToolsOCRCommand extends BaseInteractionImageCommandOption {
  description = 'Read text inside of an Image (Optical Character Recognition)';
  descriptionLocalizations = I18n.localizations('commands.tools.ocr.description');
  metadata = {
    id: Formatter.Commands.ToolsOCR.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.ocr.name');

  constructor() {
    super({
      ratelimits: CommandRatelimits.ML,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsOCR.CommandArgs) {
    return Formatter.Commands.ToolsOCR.createMessage(context, {url: args.url});
  }
}
