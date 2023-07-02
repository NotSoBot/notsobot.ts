import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class TagRandomCommand extends BaseInteractionCommandOption {
  description = 'Show a random tag';
  metadata = {
    id: Formatter.Commands.TagRandom.COMMAND_ID,
  };
  name = 'random';

  constructor() {
    super({
      options: [
        {
          name: 'arguments',
          description: 'Tag\'s Arguments',
        },
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
          description: 'User to list tags for',
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagRandom.CommandArgs) {
    return Formatter.Commands.TagRandom.createMessage(context, args);
  }

  async onRunError(context: Interaction.InteractionContext, args: Formatter.Commands.TagRandom.CommandArgs, error: any) {
    if (context.metadata && context.metadata.tag) {
      await Formatter.Commands.TagShow.increaseUsage(context, context.metadata.tag);
    }
    return super.onRunError && super.onRunError(context, args, error);
  }

  async onSuccess(context: Interaction.InteractionContext, args: Formatter.Commands.TagRandom.CommandArgs) {
    if (context.metadata && context.metadata.tag) {
      await Formatter.Commands.TagShow.increaseUsage(context, context.metadata.tag);
    }
    return super.onSuccess && super.onSuccess(context, args);
  }
}
