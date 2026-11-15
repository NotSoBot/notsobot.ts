import { Interaction } from 'detritus-client';

import { GameFlagDifficulties } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class GameFlagCommand extends BaseInteractionCommandOption {
  description = 'Name the country behind each flag, the fewer hints you need the more it\'s worth';
  descriptionLocalizations = I18n.localizations('commands.game.flag.description');
  metadata = {
    id: Formatter.Commands.GameFlag.COMMAND_ID,
  };
  name = 'flag';
  nameLocalizations = I18n.localizations('commands.game.flag.name');
  // everyone in the channel plays it
  ignoresEphemeralSetting = true;

  constructor() {
    super({
      options: [
        {
          name: 'difficulty',
          description: 'Which flags can come up',
          ...I18n.optionLocalizations('commands.game.flag.difficulty'),
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
