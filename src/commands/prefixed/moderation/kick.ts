import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'kick';

export default class KickCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clean', type: (value: string) => Parameters.seconds(value)},
      ],
      default: null,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Kick multiple members, add a reason, and clean their messages.',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} 300505364032389122 -clean 1 day`,
          `${COMMAND_NAME} 300505364032389122 <@439205512425504771>`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> some reason here`,
        ],
        id: Formatter.Commands.ModerationKick.COMMAND_ID,
        usage: '...?<user:id|mention> <reason (string)> (-clean <days>)',
      },
      permissionsClient: [Permissions.BAN_MEMBERS, Permissions.EMBED_LINKS, Permissions.KICK_MEMBERS],
      permissions: [Permissions.KICK_MEMBERS],
      type: Parameters.banPayload({membersOnly: true}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationKick.CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationKick.CommandArgsBefore) {
    if (args.payload) {
      return context.editOrReply(`${StatusEmojis.WARNING} Couldn't find any members. (Use Mentions or User IDs)`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} Provide some members`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationKick.CommandArgs) {
    return Formatter.Commands.ModerationKick.createMessage(context, args);
  }
}
