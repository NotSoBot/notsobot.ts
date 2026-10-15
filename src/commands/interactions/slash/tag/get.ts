import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionTagWriteCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'get';

export class TagGetCommand extends BaseInteractionTagWriteCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Get a tag from the Tag Directory or your DMs';
  descriptionLocalizations = I18n.localizations('commands.tag.get.description');
  metadata = {
    id: Formatter.Commands.TagGet.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag Directory id or link, or a tag from your DMs',
          ...I18n.optionLocalizations('commands.tag.get.tag'),
          required: true,
          value: Parameters.tagToGet,
          onAutoComplete: Parameters.AutoComplete.tagsToGet,
        },
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.get.name'),
          value: Parameters.tagName,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagGet.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagGet.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag_get.unknown')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagGet.CommandArgs) {
    return Formatter.Commands.TagGet.createMessage(context, args);
  }
}
