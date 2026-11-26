import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GameFlagDifficulties } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


// Flag Guesser, played in chat. The id stays `game.flag` from when this was `/game flag` (server rules, stats and
// categories are keyed by it)
export class GamesFlagGuesserCommand extends BaseInteractionCommandOption {
  description = 'Name the country behind each flag, the fewer hints you need the more it\'s worth';
  descriptionLocalizations = I18n.localizations('commands.games.flag_guesser.description');
  metadata = {
    id: Formatter.Commands.GameFlag.COMMAND_ID,
  };
  name = 'flag-guesser';
  nameLocalizations = I18n.localizations('commands.games.flag_guesser.name');
  // everyone in the channel plays it
  ignoresEphemeralSetting = true;

  constructor() {
    super({
      // was the whole `/game` group's, `play` doesn't need it
      permissions: [Permissions.ATTACH_FILES],
      options: [
        {
          name: 'difficulty',
          description: 'Which flags can come up',
          ...I18n.optionLocalizations('commands.games.flag_guesser.difficulty'),
          choices: Parameters.Slash.oneOf({
            choices: GameFlagDifficulties,
            defaultChoice: GameFlagDifficulties.EASY,
            doNotSort: true,
            localizationKey: 'choices.game_flag_difficulties',
            descriptions: {
              [GameFlagDifficulties.EASY]: 'Easy (well-known countries)',
              [GameFlagDifficulties.MEDIUM]: 'Medium (every country)',
              [GameFlagDifficulties.HARD]: 'Hard (territories too)',
            },
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.GameFlag.CommandArgs) {
    return Formatter.Commands.GameFlag.createMessage(context, args);
  }
}
