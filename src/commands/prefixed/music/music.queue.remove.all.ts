import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music queue remove all';

export default class MusicQueueRemoveAllCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      args: [
        {name: 'from', type: Parameters.memberOrUser()},
      ],
      metadata: {
        description: 'Clear the music queue, or only what a user queued',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -from cake#1`,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicQueueRemoveAll.COMMAND_ID,
        usage: '(-from <user:id|mention|name>)',
      },
      priority: 2,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MusicQueueRemoveAll.CommandArgs) {
    return args.from !== null;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.MusicQueueRemoveAll.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicQueueRemoveAll.CommandArgs) {
    return Formatter.Commands.MusicQueueRemoveAll.createMessage(context, args);
  }
}
