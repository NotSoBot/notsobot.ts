import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music queue remove';

// `1 3 5` or `1,3,5`, anything that isn't a positive number is left out
function positions(value: string): Array<number> {
  const numbers = value.split(/[\s,]+/).filter(Boolean).map((x) => parseInt(x));
  return Array.from(new Set(numbers.filter((x) => Number.isSafeInteger(x) && 0 < x)));
}

export default class MusicQueueRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'positions',
      metadata: {
        description: 'Remove tracks from the music queue by their positions',
        examples: [
          `${COMMAND_NAME} 2`,
          `${COMMAND_NAME} 1 3 5`,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicQueueRemove.COMMAND_ID,
        usage: '<...position:number>',
      },
      priority: 1,
      type: positions,
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
