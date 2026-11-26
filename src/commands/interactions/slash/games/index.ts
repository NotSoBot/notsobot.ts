import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { GamesFlagGuesserCommand } from './flag-guesser';
import { GamesPlayCommand } from './play';


// every game in one place: `play` opens the activity's game rooms, the rest are played in chat. `imagine` joins these
// once it's public, it's `/owner game imagine` while it's tested. The group itself never defers, `play` launches the
// activity as the interaction's first answer (`answersItselfFirst` and detritus' loading trigger go by the subcommand)
export default class GamesGroupCommand extends BaseSlashCommand {
  description = 'Games to play with everyone, in chat or in the NotSoBot Activity';
  descriptionLocalizations = I18n.localizations('commands.games.description');
  name = 'games';

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
        new GamesFlagGuesserCommand(),
        new GamesPlayCommand(),
      ],
    });
  }
}
