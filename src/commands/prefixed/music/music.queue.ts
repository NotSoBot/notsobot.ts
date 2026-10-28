import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music queue';

export default class MusicQueueCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      args: [
        {name: 'from', aliases: ['user'], type: Parameters.memberOrUser()},
      ],
      metadata: {
        description: 'Show what the music is playing and what is queued after it, or only what a user queued',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -from cake`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicQueue.COMMAND_ID,
        usage: '(-from <user:id|mention|name>)',
      },
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MusicQueue.CommandArgs) {
    return args.from !== null;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.MusicQueue.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.MusicQueue.CommandArgs) {
    return Formatter.Commands.MusicQueue.createMessage(context, args);
  }
}
