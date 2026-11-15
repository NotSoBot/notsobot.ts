import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

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
        {
          name: 'rounds',
          description: `How many flags (${Formatter.Commands.GameFlag.MIN_ROUNDS} to ${Formatter.Commands.GameFlag.MAX_ROUNDS}, ${Formatter.Commands.GameFlag.DEFAULT_ROUNDS} by default)`,
          ...I18n.optionLocalizations('commands.game.flag.rounds'),
          maxValue: Formatter.Commands.GameFlag.MAX_ROUNDS,
          minValue: Formatter.Commands.GameFlag.MIN_ROUNDS,
          type: ApplicationCommandOptionTypes.INTEGER,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.GameFlag.CommandArgs) {
    return Formatter.Commands.GameFlag.createMessage(context, args);
  }
}
