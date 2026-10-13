import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'avatar';

export default class AvatarCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'default', type: Boolean},
      ],
      default: DefaultParameters.author,
      label: 'user',
      metadata: {
        category: CommandCategories.INFO,
        description: 'Get the avatar for a user, defaults to self',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.InfoAvatar.COMMAND_ID,
        usage: '?<user:id|mention|name> (-default)',
      },
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoAvatar.CommandArgsBefore) {
    return !!args.user;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoAvatar.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoAvatar.CommandArgs) {
    return Formatter.Commands.InfoAvatar.createMessage(context, args);
  }
}
