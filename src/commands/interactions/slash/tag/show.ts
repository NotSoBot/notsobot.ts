import { Interaction } from 'detritus-client';

import { RestResponsesRaw } from '../../../../api/types';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgsBefore {
  arguments?: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export class TagShowCommand extends BaseInteractionCommandOption {
  description = 'Show a tag';
  metadata = {
    id: Formatter.Commands.TagShow.COMMAND_ID,
  };
  name = 'show';

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          label: 'tag',
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
        {
          name: 'arguments',
          description: 'Tag\'s Arguments',
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (args.tag === false) {
      return editOrReply(context, '⚠ Unknown Tag');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgs) {
    return Formatter.Commands.TagShow.createMessage(context, args);
  }

  async onRunError(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgs, error: any) {
    await Formatter.Commands.TagShow.increaseUsage(context, args.tag);
    return super.onRunError && super.onRunError(context, args, error);
  }

  async onSuccess(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgs) {
    await Formatter.Commands.TagShow.increaseUsage(context, args.tag);
    return super.onSuccess && super.onSuccess(context, args);
  }
}
