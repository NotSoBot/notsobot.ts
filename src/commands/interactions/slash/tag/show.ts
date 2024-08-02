import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { RestResponsesRaw } from '../../../../api/types';
import { BooleanEmojis } from '../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommand, BaseInteractionCommandOption } from '../../basecommand';


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
        {
          name: 'attachment',
          description: 'Media File',
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgsBefore) {
    if (!args.tag) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgs) {
    return Formatter.Commands.TagShow.createMessage(context, args);
  }

  async onRunError(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgs, error: any) {
    await Formatter.Commands.TagShow.increaseUsage(context, args.tag);
    return BaseInteractionCommand.prototype.onRunError.call(this, context, args, error);
  }

  async onSuccess(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgs) {
    await Formatter.Commands.TagShow.increaseUsage(context, args.tag);
    return BaseInteractionCommand.prototype.onSuccess.call(this, context, args);
  }
}
