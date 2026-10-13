import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../utils';

import { BaseInteractionTagWriteCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'add';

export class TagAddCommand extends BaseInteractionTagWriteCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Add a tag from the Tag Directory or your DMs';
  descriptionLocalizations = I18n.localizations('commands.tag.add.description');
  metadata = {
    id: Formatter.Commands.TagAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag Directory id or link, or a tag from your DMs',
          ...I18n.optionLocalizations('commands.tag.add.tag'),
          required: true,
          value: Parameters.tagToAdd,
          onAutoComplete: Parameters.AutoComplete.tagsToAdd,
        },
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.add.name'),
          value: Parameters.tagName,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagAdd.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagAdd.CommandArgs) {
    return Formatter.Commands.TagAdd.createMessage(context, args);
  }
}
