import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageFlags } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../utils';

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
  name = COMMAND_NAME;
  triggerLoadingAfter = 2000;

  constructor() {
    super({
      options: [
        {name: 'code', description: 'Code to evaluate', required: true},
        {name: 'async', type: Boolean, description: 'Wrap the code in an async block'},
        {name: 'jsonspacing', type: Number, description: 'Spacing for the JSON encoder'},
        {name: 'noembed', type: Boolean, description: 'Output the result without an Embed'},
        {name: 'noreply', type: Boolean, description: 'Do not reply'},
        {name: 'upload', type: Boolean, description: 'Upload as text file'},
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
