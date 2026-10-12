import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class TagRemoveAllCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Remove all of a Server\'s tags, with filters';
  descriptionLocalizations = I18n.localizations('commands.tag.remove.all.description');
  metadata = {
    id: Formatter.Commands.TagRemoveAll.COMMAND_ID,
  };
  name = 'all';
  nameLocalizations = I18n.localizations('commands.tag.remove.all.name');

  constructor() {
    super({
      options: [
        {
          name: 'content',
          description: 'Match the tag\'s content',
          ...I18n.optionLocalizations('commands.tag.remove.all.content'),
          maxLength: 1000,
          value: Parameters.string({maxLength: 1000}),
        },
        {
          name: 'name',
          description: 'Match the tag\'s name',
          ...I18n.optionLocalizations('commands.tag.remove.all.name'),
          maxLength: 64,
          value: Parameters.string({maxLength: 64}),
        },
        {
          name: 'user',
          description: 'User to remove tags for',
          ...I18n.optionLocalizations('commands.tag.remove.all.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    return args.user !== null;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.user === null) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.TagRemoveAll.CommandArgs) {
    return Formatter.Commands.TagRemoveAll.createMessage(context, args);
  }
}
