import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { DefaultParameters, Formatter, findImageUrlInMessage } from '../../../../utils';

import { BaseContextMenuMessageCommand, ContextMenuMessageArgs } from '../../basecommand';


export interface TranslateCommandArgs extends ContextMenuMessageArgs {
  text: string,
  url?: string | null,
}

export const COMMAND_NAME = 'Translate (w/ OCR)';

export default class TranslateCommand extends BaseContextMenuMessageCommand {
  name = COMMAND_NAME;

  onBeforeRun(context: Interaction.InteractionContext, args: TranslateCommandArgs) {
    args.text = args.message.content;
    args.url = findImageUrlInMessage(args.message);
    return !!(args.text || args.url);
  }

  onCancelRun(context: Interaction.InteractionContext, args: TranslateCommandArgs) {
    return context.editOrRespond({
      content: 'Message must have some sort of text or image to translate!',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: TranslateCommandArgs) {
    const to = await DefaultParameters.locale(context);
    if (args.url) {
      return Formatter.Commands.ToolsOCRTranslate.createMessage(context, {
        isEphemeral: true,
        to,
        url: args.url,
      });
    }
    return Formatter.Commands.ToolsTranslate.createMessage(context, {
      isEphemeral: true,
      text: args.text,
      to,
    });
  }
}
