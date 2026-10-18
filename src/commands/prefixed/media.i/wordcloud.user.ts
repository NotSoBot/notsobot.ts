import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'wordcloud user';

export default class WordcloudUserCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['wc user', 'wordcloud u', 'wc u'],
      args: [
        {name: 'before', type: Parameters.snowflake},
        {name: 'max', default: 500, type: Parameters.number({max: 1000, min: 1})},
      ],
      default: DefaultParameters.author,
      label: 'user',
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Generate a wordcloud from a user\'s past messages in this channel',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} @cakedan`,
          `${COMMAND_NAME} 300505364032389122 -max 200`,
        ],
        id: Formatter.Commands.MediaICreateWordcloudUser.COMMAND_ID,
        usage: '?<user:id|mention|name> (-before <message_id>) (-max <number>)',
      },
      // `wordcloud` would otherwise try to read "user ..." as a channel
      priority: 1,
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.MediaICreateWordcloudUser.CommandArgs) {
    return !!args.user;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.MediaICreateWordcloudUser.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: translate('errors.user_not_found')});
  }

  run(context: Command.Context, args: Formatter.Commands.MediaICreateWordcloudUser.CommandArgs) {
    return Formatter.Commands.MediaICreateWordcloudUser.createMessage(context, args);
  }
}
