import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, findImageUrlInMessage } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export interface OCRCommandArgs extends ContextMenuMessageArgs {
  url?: string | null,
}

export const COMMAND_NAME = 'OCR';

export default class OCRCommand extends BaseContextMenuMessageCommand {
  metadata = {
    id: Formatter.Commands.ToolsOCR.COMMAND_ID,
  };
  name = COMMAND_NAME;

  onBeforeRun(context: Interaction.InteractionContext, args: OCRCommandArgs) {
    args.url = findImageUrlInMessage(args.message);
    return !!args.url;
  }

  onCancelRun(context: Interaction.InteractionContext, args: OCRCommandArgs) {
    return context.editOrRespond({
      content: 'Message must have some sort of image to read!',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: OCRCommandArgs) {
    return Formatter.Commands.ToolsOCR.createMessage(context, {
      isEphemeral: true,
      url: args.url || '',
    });
  }
}
