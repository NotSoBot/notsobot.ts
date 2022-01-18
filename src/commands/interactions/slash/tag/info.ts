import { Interaction } from 'detritus-client';

import { RestResponsesRaw } from '../../../../api/types';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export class TagInfoCommand extends BaseInteractionCommandOption {
  description = 'View a Tag\'s Information';
  name = 'info';

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

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagInfo.CommandArgs) {
    return Formatter.Commands.TagInfo.createMessage(context, args);
  }
}
