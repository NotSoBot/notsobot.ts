import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { BooleanEmojis, CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'avatar';

export default class AvatarCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'default', type: Boolean},
        {name: 'noembed', default: DefaultParameters.noEmbed, type: () => true},
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
        usage: '?<user:id|mention|name> (-default) (-noembed)',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoAvatar.CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.InfoAvatar.CommandArgsBefore) {
    return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that user.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoAvatar.CommandArgs) {
    return Formatter.Commands.InfoAvatar.createMessage(context, args);
  }
}
