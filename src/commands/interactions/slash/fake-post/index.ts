import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { BlueskyCommand } from './bluesky';
import { MastodonCommand } from './mastodon';
import { ThreadsCommand } from './threads';
import { TruthCommand } from './truth';
import { TweetCommand } from './tweet';


// images made to look like a screenshot of a short post: x, truth social, bluesky. split from `/fake` (one command can't
// hold every site's options), their ids are still `fun.*`
export default class FakePostGroupCommand extends BaseSlashCommand {
  description = 'Fake screenshots of posts: X, Bluesky, Truth Social and more';
  descriptionLocalizations = I18n.localizations('commands.fake_post.description');
  name = 'fake-post';
  nameLocalizations = I18n.localizations('commands.fake_post.name');

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
        new BlueskyCommand(),
        new MastodonCommand(),
        new ThreadsCommand(),
        new TruthCommand(),
        new TweetCommand(),
      ],
    });
  }
}
