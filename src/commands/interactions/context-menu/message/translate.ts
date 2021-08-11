import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../utils';

import { BaseCommand, CommandArgs } from './basecommand';


export const COMMAND_NAME = 'Translate';

export default class TranslateCommand extends BaseCommand {
  name = COMMAND_NAME;

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return !!args.message.content;
  }

  onCancelRun(context: Interaction.InteractionContext, args: CommandArgs) {
    return context.editOrRespond({
      content: 'Message must have some sort of text to translate!',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const text = args.message.content;
    const to = Parameters.ContextMenu.serverLocale(context);
    return Formatter.Commands.ToolsTranslate.createMessage(context, {isEphemeral: true, text, to});
  }
}
