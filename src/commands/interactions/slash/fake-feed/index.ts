import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { FacebookCommand } from './facebook';
import { InstagramCommand } from './instagram';
import { LinkedinCommand } from './linkedin';
import { RedditCommand } from './reddit';



// images made to look like a screenshot of a post in a feed: reddit, facebook, linkedin, instagram. beside `/fake` and
// `/fake-post` (one command can't hold every site's options), their ids are `fun.*` like the rest
export default class FakeFeedGroupCommand extends BaseSlashCommand {
  description = 'Fake screenshots of feed posts: Reddit, Facebook, LinkedIn and more';
  descriptionLocalizations = I18n.localizations('commands.fake_feed.description');
  name = 'fake-feed';
  nameLocalizations = I18n.localizations('commands.fake_feed.name');

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
        new FacebookCommand(),
        new InstagramCommand(),
        new LinkedinCommand(),
        new RedditCommand(),
      ],
    });
  }
}
