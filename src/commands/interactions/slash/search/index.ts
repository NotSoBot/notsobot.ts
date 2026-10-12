import { Interaction } from 'detritus-client';
import {
  ApplicationIntegrationTypes,
  InteractionCallbackTypes,
  InteractionContextTypes,
  MessageFlags,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { Search4ChanCommand } from './4chan';
import { SearchDuckDuckGoGroupCommand } from './duckduckgo';
import { SearchGoogleGroupCommand } from './google';
import { SearchImagesCommand } from './images';
import { SearchImagesSimpleCommand } from './images-simple';
import { SearchImgurCommand } from './imgur';
import { SearchRedditCommand } from './reddit';
import { SearchSteamGroupCommand } from './steam';
import { SearchUrbanCommand } from './urban';
import { SearchWikihowCommand } from './wikihow';
import { SearchWolframAlphaCommand } from './wolframalpha';

import { SearchYoutubeCommand } from './youtube';


export default class SearchGroupCommand extends BaseSlashCommand {
  description = 'Search Commands';
  descriptionLocalizations = I18n.localizations('commands.search.description');
  name = 'search';
  nameLocalizations = I18n.localizations('commands.search.name');
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
        new Search4ChanCommand(),
        new SearchDuckDuckGoGroupCommand(),
        new SearchGoogleGroupCommand(),
        new SearchImagesCommand(),
        new SearchImagesSimpleCommand(),
        new SearchImgurCommand(),
        new SearchRedditCommand(),
        new SearchSteamGroupCommand(),
        new SearchUrbanCommand(),
        new SearchWikihowCommand(),
        new SearchWolframAlphaCommand(),
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
