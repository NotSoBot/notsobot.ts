import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, Parameters, findImageUrlInMessage } from '../../../../utils';

import { BaseCommand, CommandArgs } from './basecommand';


export interface TranslateCommandArgs extends CommandArgs {
  text: string,
  url?: string | null,
}

export const COMMAND_NAME = 'Translate';

export default class TranslateCommand extends BaseCommand {
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
    const to = Parameters.ContextMenu.serverLocale(context);
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
