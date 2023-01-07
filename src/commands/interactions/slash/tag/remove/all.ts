import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TagRemoveAllCommand extends BaseInteractionCommandOption {
  description = 'Remove all of a Server\'s tags, with filters';
  metadata = {
    id: Formatter.Commands.TagRemoveAll.COMMAND_ID,
  };
  name = 'all';

  constructor() {
    super({
      options: [
        {
          name: 'content',
          description: 'Match the tag\'s content',
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'user',
          description: 'User to remove tags for',
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    return args.user !== null;
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    if (args.user === null) {
      return editOrReply(context, '⚠ Unable to find that user.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    return Formatter.Commands.TagRemoveAll.createMessage(context, args);
  }
}
