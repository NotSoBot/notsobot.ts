import {
  ApplicationIntegrationTypes,
  InteractionContextTypes,
  Permissions,
} from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { QuoteCommand } from './quote';
import { TruthCommand } from './truth';
import { TweetCommand } from './tweet';


// images made to look like a screenshot: a discord message, an x post, a truth social post. `quote` moved here from
// /fun, its id is still `fun.quote`
export default class FakeGroupCommand extends BaseSlashCommand {
  description = 'Fake screenshots: a Discord message, an X post or a Truth Social post';
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
        new QuoteCommand(),
        new TruthCommand(),
        new TweetCommand(),
      ],
    });
  }
}
