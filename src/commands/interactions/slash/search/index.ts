import { Interaction } from 'detritus-client';
import { InteractionCallbackTypes, MessageFlags, Permissions } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { SearchGoogleGroupCommand } from './google';
import { SearchSteamGroupCommand } from './steam';


export default class SearchGroupCommand extends BaseSlashCommand {
  description = 'Search Commands';
  name = 'search';
  triggerLoadingAfter = 100;

  constructor() {
    super({
      options: [
        new SearchGoogleGroupCommand(),
        new SearchSteamGroupCommand(),
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
