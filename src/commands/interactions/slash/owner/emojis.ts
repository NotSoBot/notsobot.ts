import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, editOrReply } from '../../../../utils';

import { BaseOwnerCommandOption } from './base';


export const COMMAND_NAME = 'emojis';

export class OwnerEmojisCommand extends BaseOwnerCommandOption {
  description = 'Search through all emojis that NotSoBot sees';
  descriptionLocalizations = I18n.localizations('commands.owner.emojis.description');
  metadata = {
    id: Formatter.Commands.SearchDiscordEmojis.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.emojis.name');

  constructor() {
    super({
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {
          name: 'query',
          description: 'Emoji ID or Name',
          ...I18n.optionLocalizations('commands.owner.emojis.query'),
          label: 'emojis',
          required: true,
          value: Formatter.Commands.SearchDiscordEmojis.emojisSearch,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    return !!args.emojis.length;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('owner.no_emojis')}`);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchDiscordEmojis.CommandArgs) {
    return Formatter.Commands.SearchDiscordEmojis.createMessage(context, args);
  }
}
