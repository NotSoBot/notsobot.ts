import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music queue clear';

export default class MusicQueueClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      args: [
        {name: 'from', aliases: ['user'], type: Parameters.memberOrUser()},
        {name: 'playlist', type: Number},
      ],
      metadata: {
        description: 'Clear the music queue, only what a user queued, or only the playlist the track at a position is from (other people\'s need Manage Server or a NotSoMusic role)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -from cake#1`,
          `${COMMAND_NAME} -user cake#1`,
          `${COMMAND_NAME} -playlist 5`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicQueueClear.COMMAND_ID,
        usage: '(-from <user:id|mention|name>) (-playlist <position:number>)',
      },
      // ahead of `music queue`
      priority: 1,
    });
  }

  // a `-playlist` that isn't a position never falls through to clearing everything
  onBeforeRun(context: Command.Context, args: Formatter.Commands.MusicQueueClear.CommandArgs) {
    const playlist = args.playlist;
    return args.from !== null && (playlist === undefined || (Number.isSafeInteger(playlist) && 0 < playlist!));
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.MusicQueueClear.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.from === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_queue_remove.no_tracks_at_positions')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicQueueClear.CommandArgs) {
    return Formatter.Commands.MusicQueueClear.createMessage(context, args);
  }
}
