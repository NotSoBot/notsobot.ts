import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TagRemoveTagCommand extends BaseInteractionCommandOption {
  description = 'Remove a tag';
  descriptionLocalizations = I18n.localizations('commands.tag.remove.tag.description');
  metadata = {
    id: Formatter.Commands.TagRemove.COMMAND_ID,
  };
  name = 'tag';

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.remove.tag.name'),
          label: 'tag',
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemove.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemove.CommandArgs) {
    return Formatter.Commands.TagRemove.createMessage(context, args);
  }
}
