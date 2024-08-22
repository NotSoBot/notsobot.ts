import { Interaction } from 'detritus-client';

import { BooleanEmojis } from '../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'add';

export class TagAddCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Add a Tag from your DMs with NotSoBot';
  metadata = {
    id: Formatter.Commands.TagAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag to add from DM',
          required: true,
          value: Parameters.tagToAdd,
          onAutoComplete: Parameters.AutoComplete.tagsToAdd,
        },
        {
          name: 'name',
          description: 'Tag\'s Name',
          value: Parameters.tagName,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagAdd.CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagAdd.CommandArgsBefore) {
    if (args.tag !== null) {
      if (args.tag === false) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagAdd.CommandArgs) {
    return Formatter.Commands.TagAdd.createMessage(context, args);
  }
}
