import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class TagExportCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Export tags from a server with filters';
  descriptionLocalizations = I18n.localizations('commands.tag.export.description');
  metadata = {
    id: Formatter.Commands.TagExport.COMMAND_ID,
  };
  name = 'export';
  nameLocalizations = I18n.localizations('commands.tag.export.name');

  constructor() {
    super({
      options: [
        {
          name: 'content',
          description: 'Match the tag\'s content',
          ...I18n.optionLocalizations('commands.tag.export.content'),
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          ...I18n.optionLocalizations('commands.tag.export.name'),
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'user',
          description: 'User to export tags for',
          ...I18n.optionLocalizations('commands.tag.export.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagExport.CommandArgs) {
    return args.user !== null;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagExport.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.user === null) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagExport.CommandArgs) {
    return Formatter.Commands.TagExport.createMessage(context, args);
  }
}
