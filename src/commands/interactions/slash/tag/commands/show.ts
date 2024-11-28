import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { RestResponsesRaw } from '../../../../../api/types';
import { BooleanEmojis } from '../../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommand, BaseInteractionCommandOption } from '../../../basecommand';


export class TagCommandsShowCommand extends BaseInteractionCommandOption {
  description = 'Execute a custom command tag';
  metadata = {
    id: Formatter.Commands.TagShowCustomCommand.COMMAND_ID,
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
          value: Parameters.tagCustomCommand,
          onAutoComplete: Parameters.AutoComplete.tagsCustomCommands,
        },
        {
          name: 'arguments',
          description: 'Tag\'s Arguments',
        },
        {
          name: 'attachment',
          description: 'Media File',
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  onBeforeRun(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.TagShowCustomCommand.CommandArgsBefore,
  ) {
    return !!args.tag;
  }

  onCancelRun(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.TagShowCustomCommand.CommandArgsBefore,
  ) {
    if (!args.tag) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
    }
    return super.onCancelRun(context, args);
  }

  async run(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.TagShowCustomCommand.CommandArgs,
  ) {
    return Formatter.Commands.TagShowCustomCommand.createMessage(context, args);
  }
}
