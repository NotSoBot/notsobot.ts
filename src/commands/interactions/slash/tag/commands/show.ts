import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { RestResponsesRaw } from '../../../../../api/types';
import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommand, BaseInteractionCommandOption } from '../../../basecommand';


export class TagCommandsShowCommand extends BaseInteractionCommandOption {
  description = 'Run a custom command tag';
  descriptionLocalizations = I18n.localizations('commands.tag.commands.show.description');
  metadata = {
    id: Formatter.Commands.TagShowCustomCommand.COMMAND_ID,
  };
  name = 'show';
  nameLocalizations = I18n.localizations('commands.tag.commands.show.name');

  constructor() {
    super({
      options: [
        {
          name: 'name',
          description: 'Tag\'s Name',
          ...I18n.optionLocalizations('commands.tag.commands.show.name'),
          label: 'tag',
          required: true,
          value: Parameters.tagCustomCommand,
          onAutoComplete: Parameters.AutoComplete.tagsCustomCommands,
        },
        {
          name: 'arguments',
          description: 'Tag\'s Arguments',
          ...I18n.optionLocalizations('commands.tag.commands.show.arguments'),
        },
        {
          name: 'attachment',
          description: 'Media File',
          ...I18n.optionLocalizations('commands.tag.commands.show.attachment'),
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  onBeforeRun(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.TagShowCustomCommand.CommandArgsBefore,
  ) {
    return !!args.tag;
  }

  async onCancelRun(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.TagShowCustomCommand.CommandArgsBefore,
  ) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.tag) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('tag.unknown')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(
    context: Interaction.InteractionContext,
    args: Formatter.Commands.TagShowCustomCommand.CommandArgs,
  ) {
    return Formatter.Commands.TagShowCustomCommand.createMessage(context, args);
  }
}
