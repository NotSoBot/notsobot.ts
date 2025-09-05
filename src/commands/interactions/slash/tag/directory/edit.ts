import { Interaction } from 'detritus-client';

import { BooleanEmojis } from '../../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'edit';

export class TagDirectoryEditCommand extends BaseInteractionCommandOption {
  description = 'Edit one of your tags on the Tag Directory';
  metadata = {
    id: Formatter.Commands.TagDirectoryEdit.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Your Tag from the Directory',
          required: true,
          value: Parameters.tagFromDirectoryToEdit,
          // todo: add autocomplete
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

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryEdit.CommandArgsBefore) {
    return !!args.tag && (!!args.content || !!args.description || !!args.title);
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryEdit.CommandArgsBefore) {
    if (args.tag !== null) {
      if (args.tag === false) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
      }
    }
    if (!args.content && !args.description && !args.title) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Must set the content, description (wip), or title (wip) at least.`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryEdit.CommandArgs) {
    return Formatter.Commands.TagDirectoryEdit.createMessage(context, args);
  }
}
