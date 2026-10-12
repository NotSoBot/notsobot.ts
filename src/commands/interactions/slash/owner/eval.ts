import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  async?: boolean,
  code: string,
  jsonspacing?: number,
  noembed?: boolean,
  noreply?: boolean,
  upload?: boolean,
}

export const COMMAND_NAME = 'eval';

export class OwnerEvalCommand extends BaseInteractionCommandOption {
  description = 'Eval some code ;)';
  descriptionLocalizations = I18n.localizations('commands.owner.eval.description');
  name = COMMAND_NAME;
  triggerLoadingAfter = 2000;

  constructor() {
    super({
      options: [
        {name: 'code', description: 'Code to evaluate', ...I18n.optionLocalizations('commands.owner.eval.code'), required: true},
        {name: 'async', type: Boolean, description: 'Wrap the code in an async block', ...I18n.optionLocalizations('commands.owner.eval.async')},
        {name: 'jsonspacing', type: Number, description: 'Spacing for the JSON encoder', ...I18n.optionLocalizations('commands.owner.eval.jsonspacing')},
        {name: 'noembed', type: Boolean, description: 'Output the result without an Embed', ...I18n.optionLocalizations('commands.owner.eval.noembed')},
        {name: 'noreply', type: Boolean, description: 'Do not reply', ...I18n.optionLocalizations('commands.owner.eval.noreply')},
        {name: 'upload', type: Boolean, description: 'Upload as text file', ...I18n.optionLocalizations('commands.owner.eval.upload')},
      ],
    });
  }

  onBefore(context: Interaction.InteractionContext) {
    return context.user.isClientOwner;
  }

  onCancel(context: Interaction.InteractionContext) {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {
      content: 'no',
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.OwnerEval.createMessage(context, {
      ...args,
      code: Parameters.codeblock(args.code),
    });
  }
}
