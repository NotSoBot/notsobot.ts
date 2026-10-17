import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgs {
  async?: boolean,
  code: string,
  jsonspacing?: number,
  noreply?: boolean,
  upload?: boolean,
}

export const COMMAND_NAME = 'eval';

export class OwnerEvalCommand extends BaseInteractionCommandOption {
  description = 'Eval some code ;)';
  descriptionLocalizations = I18n.localizations('commands.owner.eval.description');
  metadata = {
    id: Formatter.Commands.OwnerEval.COMMAND_ID,
  };
  name = COMMAND_NAME;
  triggerLoadingAfter = 2000;

  constructor() {
    super({
      options: [
        {name: 'code', description: 'Code to evaluate', ...I18n.optionLocalizations('commands.owner.eval.code'), required: true},
        {name: 'async', type: Boolean, description: 'Wrap the code in an async block', ...I18n.optionLocalizations('commands.owner.eval.async')},
        {name: 'jsonspacing', type: Number, description: 'Spacing for the JSON encoder', ...I18n.optionLocalizations('commands.owner.eval.jsonspacing')},
        {name: 'noreply', type: Boolean, description: 'Do not reply', ...I18n.optionLocalizations('commands.owner.eval.noreply')},
        {name: 'upload', type: Boolean, description: 'Upload as text file', ...I18n.optionLocalizations('commands.owner.eval.upload')},
      ],
    });
  }

  onBefore(context: Interaction.InteractionContext) {
    return context.user.isClientOwner;
  }

  onCancel(context: Interaction.InteractionContext) {
    return displayReply(context, {description: 'no', ephemeral: true});
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.OwnerEval.createMessage(context, {
      ...args,
      code: Parameters.codeblock(args.code),
    });
  }
}
