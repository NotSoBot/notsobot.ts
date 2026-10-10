import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { RestResponsesRaw } from '../../../../api/types';
import { StatusEmojis } from '../../../../constants';
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

  onBefore(context: Interaction.InteractionContext) {
    return false;
  }

  onCancel(context: Interaction.InteractionContext) {
    return editOrReply(context, `
### ${StatusEmojis.WARNING} The tag system has been disabled at this time at Discord's request.
Discord gave us two weeks to remove the tag system due to content moderation concerns. We've since added new safety filters and reached out to Discord about keeping the feature. We're sorry for the disruption, especially to everyone who built games and collections with tags. For updates or questions, join our support server: <https://notsobot.com/support/invite>
`
    );
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgsBefore) {
    if (!args.tag) {
      return editOrReply(context, `${StatusEmojis.WARNING} Unknown Tag`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagShow.CommandArgs) {
    return Formatter.Commands.TagShow.createMessage(context, args);
  }
}
