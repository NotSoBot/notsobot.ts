import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'verify';

export class TagDirectoryVerifyCommand extends BaseInteractionCommandOption {
  description = 'Ask NotSoBot staff to verify one of your tags on the Tag Directory';
  descriptionLocalizations = I18n.localizations('commands.tag.directory.verify.description');
  metadata = {
    id: Formatter.Commands.TagDirectoryVerify.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.directory.verify.name');

  constructor() {
    super({
      options: [
        {
          name: 'tag',
          description: 'Your Tag from the Directory',
          ...I18n.optionLocalizations('commands.tag.directory.verify.tag'),
          required: true,
          value: Parameters.tagFromDirectoryToEdit,
          onAutoComplete: Parameters.AutoComplete.tagsOnDirectoryToEdit,
        },
        {
          name: 'cancel',
          description: 'Cancel your pending verification request instead',
          ...I18n.optionLocalizations('commands.tag.directory.verify.cancel'),
          type: Boolean,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryVerify.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryVerify.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag !== null) {
      if (args.tag === false) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`});
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagDirectoryVerify.CommandArgs) {
    return Formatter.Commands.TagDirectoryVerify.createMessage(context, args);
  }
}
