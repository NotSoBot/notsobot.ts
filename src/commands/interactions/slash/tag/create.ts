import { Interaction } from 'detritus-client';

import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export interface CommandArgsBefore {
  content: string,
  tag: string,
}

export class TagCreateCommand extends BaseInteractionCommandOption {
  description = 'Create a tag';
  metadata = {
    id: Formatter.Commands.TagCreate.COMMAND_ID,
  };
  name = 'create';

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          label: 'tag',
          required: true,
          value: Parameters.tagName,
        },
        {
          name: 'content',
          description: 'Tag\'s Content',
          required: true,
          value: Parameters.tagContent,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    return !!args.tag && !!args.content;
  }

  onCancelRun(context: Interaction.InteractionContext, args: CommandArgsBefore) {
    if (args.tag || args.content) {
      if (!args.tag) {
        return editOrReply(context, '⚠ Gotta have some sort of tag name');
      }
      if (!args.content) {
        return editOrReply(context, '⚠ Must have some sort of content for the tag!');
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagCreate.CommandArgs) {
    return Formatter.Commands.TagCreate.createMessage(context, args);
  }
}
