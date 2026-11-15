import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GameFlagDifficulties } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'game flag';

export default class GameFlagCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['flaggame', 'guessflag'],
      label: 'difficulty',
      metadata: {
        category: CommandCategories.GAMES,
        description: `Name the country behind a flag in chat within ${Formatter.Commands.GameFlag.ROUND_TIME / 1000} seconds. It starts worth ${Formatter.Commands.GameFlag.MAX_POINTS} points and a hint (its region, then its letters) takes one off every ${Formatter.Commands.GameFlag.HINT_TIME / 1000} seconds. Play Again shows another flag and keeps the scores, naming ${Formatter.Commands.GameFlag.STREAK_BONUS_AT} or more in a row adds a point each`,
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} medium`,
          `${COMMAND_NAME} hard`,
        ],
        id: Formatter.Commands.GameFlag.COMMAND_ID,
        usage: '?<easy|medium|hard>',
      },
      permissionsClient: [Permissions.ATTACH_FILES],
      type: Parameters.oneOf({choices: GameFlagDifficulties}),
    });
  }

  run(context: Command.Context, args: Formatter.Commands.GameFlag.CommandArgs) {
    return Formatter.Commands.GameFlag.createMessage(context, args);
  }
}
