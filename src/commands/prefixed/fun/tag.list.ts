import { Command, CommandClient, Structures } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  content?: string,
  global?: boolean,
  name?: string,
  user: Structures.Member | Structures.User,
}

export const COMMAND_NAME = 'tag list';

export default class TagListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t list'],
      args: [
        {name: 'content', type: Parameters.string({maxLength: 1000})},
        {name: 'global', type: Boolean},
        {name: 'name', type: Parameters.string({maxLength: 64})},
      ],
      default: DefaultParameters.authorOrReplyAuthor({allowBots: false}),
      label: 'user',
      metadata: {
        category: CommandCategories.TAGS,
        description: 'List all of a user\'s tags',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} <@439205512425504771>`,
        ],
        id: Formatter.Commands.TagListUser.COMMAND_ID,
        usage: '?<user:id|mention|name> (-content <text>) (-global) (-name <text>)',
      },
      type: Parameters.memberOrUser({allowBots: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.TagListUser.createMessage(context, args);
  }
}
