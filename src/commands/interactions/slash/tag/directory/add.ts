import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class TagDirectoryAddCommand extends BaseInteractionCommandOption {
  description = 'Add one of your tags from your DMs with NotSoBot to the Tag Directory';
  descriptionLocalizations = I18n.localizations('commands.tag.directory.add.description');
  metadata = {
    id: Formatter.Commands.TagDirectoryAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.directory.add.name');

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Tag to add to directory from DM',
          ...I18n.optionLocalizations('commands.tag.directory.add.tag'),
          required: true,
          value: Parameters.tagToAddToDirectory,
          onAutoComplete: Parameters.AutoComplete.tagsToAddToDirectory,
        },
        {
          name: 'category',
          description: 'Category to list the tag under (Default: Other)',
          ...I18n.optionLocalizations('commands.tag.directory.add.category'),
          choices: Parameters.Slash.TAG_DIRECTORY_CATEGORIES,
          type: Number,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryAdd.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null) {
      if (args.tag === false) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`});
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryAdd.CommandArgs) {
    return Formatter.Commands.TagDirectoryAdd.createMessage(context, args);
  }
}
