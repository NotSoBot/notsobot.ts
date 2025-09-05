import { Interaction } from 'detritus-client';

import { BooleanEmojis } from '../../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class TagDirectoryAddCommand extends BaseInteractionCommandOption {
  description = 'Add one of your tags from your DMs with NotSoBot to the Tag Directory';
  metadata = {
    id: Formatter.Commands.TagDirectoryAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag to add to directory from DM',
          required: true,
          value: Parameters.tagToAdd,
          onAutoComplete: Parameters.AutoComplete.tagsToAdd,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryAdd.CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryAdd.CommandArgsBefore) {
    if (args.tag !== null) {
      if (args.tag === false) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryAdd.CommandArgs) {
    return Formatter.Commands.TagDirectoryAdd.createMessage(context, args);
  }
}
