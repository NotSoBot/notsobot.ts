import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music queue remove';

export default class MusicQueueRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'positions',
      metadata: {
        description: 'Remove tracks from the music queue by their positions (or ranges of them), other people\'s need Manage Server or the DJ role with DJ mode on',
        examples: [
          `${COMMAND_NAME} 2`,
          `${COMMAND_NAME} 1 3 5`,
          `${COMMAND_NAME} 5-20`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicQueueRemove.COMMAND_ID,
        usage: '<...position:number|range>',
      },
      priority: 1,
      type: Formatter.Commands.MusicQueueRemove.musicQueuePositions,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MusicQueueRemove.CommandArgs) {
    return !!args.positions.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.MusicQueueRemove.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_queue_remove.no_tracks_at_positions')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicQueueRemove.CommandArgs) {
    return Formatter.Commands.MusicQueueRemove.createMessage(context, args);
  }
}
