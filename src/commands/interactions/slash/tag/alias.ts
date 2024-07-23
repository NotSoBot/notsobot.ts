import { Interaction } from 'detritus-client';

import { BooleanEmojis } from '../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'alias';

export class TagAliasCommand extends BaseInteractionCommandOption {
  description = 'Create a Tag Alias';
  metadata = {
    id: Formatter.Commands.TagAlias.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag to add from DM',
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
        {
          name: 'name',
          description: 'Tag\'s Name',
          required: true,
          value: Parameters.tagName,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagAlias.CommandArgsBefore) {
    return !!args.tag && !!args.name;
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagAlias.CommandArgsBefore) {
    if (args.tag !== null || args.name) {
      if (!args.name) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Gotta have some sort of tag name to create an alias for`);
      }
      if (args.tag === false) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagAlias.CommandArgs) {
    return Formatter.Commands.TagAlias.createMessage(context, args);
  }
}
