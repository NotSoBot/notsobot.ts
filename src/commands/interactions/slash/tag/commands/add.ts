import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'add';

export class TagCommandsAddCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Add a tag into the custom command list';
  descriptionLocalizations = I18n.localizations('commands.tag.commands.add.description');
  metadata = {
    id: Formatter.Commands.TagCommandsAdd.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.commands.add.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.commands.add.name'),
          label: 'tag',
          required: true,
          value: Parameters.NotSoTag,
          onAutoComplete: Parameters.AutoComplete.tags,
        },
      ],
    });
  }

  async onBefore(context: Interaction.InteractionContext) {
    const reason = await Formatter.Commands.TagCommandsAdd.getCannotAddReason(context);
    if (reason) {
      context.metadata = context.metadata || {};
      context.metadata.content = reason;
      return false;
    }
    return true;
  }

  onCancel(context: Interaction.InteractionContext) {
    if (context.metadata && context.metadata.content) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${context.metadata.content}`, ephemeral: true});
    }
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagCommandsAdd.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagCommandsAdd.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`, ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagCommandsAdd.CommandArgs) {
    return Formatter.Commands.TagCommandsAdd.createMessage(context, args);
  }
}
