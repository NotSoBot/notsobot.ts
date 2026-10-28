import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'remove';

export class TagCommandsRemoveCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Stop a tag being a custom command in this server';
  descriptionLocalizations = I18n.localizations('commands.tag.commands.remove.description');
  metadata = {
    id: Formatter.Commands.TagCommandsRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.commands.remove.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.commands.remove.name'),
          label: 'tag',
          required: true,
          value: Parameters.tagCustomCommand,
          onAutoComplete: Parameters.AutoComplete.tagsCustomCommands,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagCommandsRemove.CommandArgsBefore) {
    return !!args.tag;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagCommandsRemove.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.tag === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('tag.unknown')}`, ephemeral: true});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagCommandsRemove.CommandArgs) {
    return Formatter.Commands.TagCommandsRemove.createMessage(context, args);
  }
}
