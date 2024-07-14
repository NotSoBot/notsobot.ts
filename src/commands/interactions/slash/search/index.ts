import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionCallbackTypes,
  InteractionContextTypes,
  MessageFlags,
  Permissions,
} from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { SearchGoogleGroupCommand } from './google';
import { SearchSteamGroupCommand } from './steam';

import { SearchYoutubeCommand } from './youtube';


export default class SearchGroupCommand extends BaseSlashCommand {
  description = 'Search Commands';
  name = 'search';
  triggerLoadingAfter = 100;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new SearchGoogleGroupCommand(),
        new SearchSteamGroupCommand(),
        new SearchYoutubeCommand(),
      ],
    });
  }

  onLoadingTrigger(context: Interaction.InteractionContext) {
    if (context.responded) {
      return;
    }

    if (context.member && !context.member.can([Permissions.EMBED_LINKS])) {
      return context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, {
        flags: MessageFlags.EPHEMERAL,
      });
    }

    return super.onLoadingTrigger(context);
  }
}
