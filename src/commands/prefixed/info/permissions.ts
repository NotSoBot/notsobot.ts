import { Command, CommandClient, Structures } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'permissions';

const findMember = Parameters.memberOrUser();

// a member or a role: mentions and ids go where they point, `everyone` and exact role names are roles (so `.perms mods`
// isn't taken by a member called modsfan), then members, then roles whose name starts with or contains it
async function memberOrRole(value: string, context: Command.Context): Promise<Structures.Member | Structures.Role | Structures.User | null> {
  value = value.trim();
  const { guild } = context;
  if (!value || !guild) {
    return null;
  }

  const insensitive = value.toLowerCase().replace(/^@/, '');
  if (insensitive === 'everyone') {
    return guild.defaultRole;
  }
  if (/^<@&\d+>$/.test(value) || guild.roles.has(value)) {
    return Parameters.role(value, context);
  }
  for (let [roleId, role] of guild.roles) {
    if (role.name.toLowerCase() === insensitive) {
      return role;
    }
  }
  return (await findMember(value, context)) || Parameters.role(value, context);
}

export default class PermissionsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['perms'],
      args: [
        {name: 'channel', default: DefaultParameters.channel, type: Parameters.channel()},
        {name: 'server', type: Boolean},
      ],
      default: DefaultParameters.author,
      disableDm: true,
      label: 'target',
      metadata: {
        description: 'See a member\'s or a role\'s permissions in a channel (or the whole server), and what the channel\'s overwrites changed',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} everyone -channel lobby`,
          `${COMMAND_NAME} mods -server`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoPermissions.COMMAND_ID,
        usage: '?<user:id|mention|name|role> (-channel ?<channel:id|mention|name>) (-server)',
      },
      type: memberOrRole,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoPermissions.CommandArgsBefore) {
    return (
      !!args.channel &&
      Formatter.Commands.InfoPermissions.canViewChannel(context, args.channel) &&
      (args.target instanceof Structures.Member || args.target instanceof Structures.Role)
    );
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoPermissions.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    let key: I18n.TranslationKey;
    // a channel they can't see gets the same reply as one that doesn't exist
    if (!args.channel || !Formatter.Commands.InfoPermissions.canViewChannel(context, args.channel)) {
      key = 'errors.channel_not_found';
    } else if (args.target instanceof Structures.User) {
      key = 'errors.member_not_in_server';
    } else {
      key = 'errors.member_or_role_not_found';
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate(key)}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoPermissions.CommandArgs) {
    return Formatter.Commands.InfoPermissions.createMessage(context, args);
  }
}
