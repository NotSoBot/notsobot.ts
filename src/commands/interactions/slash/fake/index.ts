import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { GreentextCommand } from './greentext';
import { QuoteCommand } from './quote';
import { SteamCommand } from './steam';
import { TiktokCommand } from './tiktok';
import { TwitchCommand } from './twitch';
import { YtcommentCommand } from './ytcomment';


// images made to look like a screenshot of a message, a comment or a review: discord's (`quote`) and other sites'.
// posts are in `/fake-post` and `/fake-feed`. `quote` moved here from /fun, its id is still `fun.quote`
export default class FakeGroupCommand extends BaseSlashCommand {
  description = 'Fake screenshots of messages, comments and reviews';
  descriptionLocalizations = I18n.localizations('commands.fake.description');
  name = 'fake';
  nameLocalizations = I18n.localizations('commands.fake.name');

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
      permissions: [Permissions.ATTACH_FILES],
      options: [
        new GreentextCommand(),
        new QuoteCommand(),
        new SteamCommand(),
        new TiktokCommand(),
        new TwitchCommand(),
        new YtcommentCommand(),
      ],
    });
  }
}
