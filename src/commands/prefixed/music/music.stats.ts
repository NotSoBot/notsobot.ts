import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MusicStatsPeriods, MusicStatsSorts } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music stats';

export default class MusicStatsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music top'],
      args: [
        {name: 'sort', aliases: ['s'], type: Parameters.oneOf({choices: MusicStatsSorts})},
      ],
      disableDm: true,
      label: 'period',
      metadata: {
        description: 'See what the music played in this server the most: totals, then the top tracks, members (by what they queued) and artists',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} week`,
          `${COMMAND_NAME} month -sort time`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicStats.COMMAND_ID,
        usage: '?<week|month|year|all> (-sort <plays|time>)',
      },
      type: Parameters.oneOf({choices: MusicStatsPeriods}),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicStats.CommandArgs) {
    return Formatter.Commands.MusicStats.createMessage(context, args);
  }
}
