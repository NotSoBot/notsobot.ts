import { Interaction } from 'detritus-client';

import { RestResponsesRaw } from '../../../../api/types';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgsBefore {
  arguments: Array<string>,
  tag: false | null | RestResponsesRaw.Tag,
}

export class TagShowCommand extends BaseInteractionCommandOption {
  description = 'Show a tag';
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
        },
        {
          name: 'arguments',
          description: 'Tag\'s Arguments',
          default: [],
          value: Parameters.stringArguments,
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
}
