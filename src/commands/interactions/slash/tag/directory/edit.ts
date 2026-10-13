import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'edit';

export class TagDirectoryEditCommand extends BaseInteractionCommandOption {
  description = 'Edit one of your tags on the Tag Directory';
  descriptionLocalizations = I18n.localizations('commands.tag.directory.edit.description');
  metadata = {
    id: Formatter.Commands.TagDirectoryEdit.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.directory.edit.name');

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Your Tag from the Directory',
          ...I18n.optionLocalizations('commands.tag.directory.edit.tag'),
          required: true,
          value: Parameters.tagFromDirectoryToEdit,
          // todo: add autocomplete
        },
        {
          name: 'content',
          description: 'Tag\'s Content',
          ...I18n.optionLocalizations('commands.tag.directory.edit.content'),
          required: true,
          value: Parameters.tagContent,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryEdit.CommandArgsBefore) {
    return !!args.tag && (!!args.content || !!args.description || !!args.title);
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryEdit.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null) {
      if (args.tag === false) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`});
      }
    }
    if (!args.content && !args.description && !args.title) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.directory_edit_needs_field')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryEdit.CommandArgs) {
    return Formatter.Commands.TagDirectoryEdit.createMessage(context, args);
  }
}
