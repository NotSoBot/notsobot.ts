import { Command, Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes, Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import GuildSettingsStore from '../../../stores/guildsettings';

import { GuildRuleActions, StatusEmojis } from '../../../constants';
import {
  I18n,
  Parameters,
  describeGuildRule,
  displayReply,
  getCommandCategory,
  getCommandIdFromInvoker,
  isGuildRulesCommandId,
  resolveGuildRule,
} from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'help-permissions-check';

export interface CommandArgs {
  command?: Command.Command | false,
}

export default class HelpPermissionsCheckCommand extends BaseSlashCommand {
  description = 'Help, the bot doesn\'t respond to prefix commands';
  descriptionLocalizations = I18n.localizations('commands.help_permissions_check.description');
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.help_permissions_check.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        {
          name: 'command',
          description: 'Command name or ID',
          ...I18n.optionLocalizations('commands.help_permissions_check.command'),
          value: async (value: string, context: Interaction.InteractionContext) => {
            return (await Parameters.prefixedCommand(value, context)) || false;
          },
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (args.command === false) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_command')}`});
    }
    let willPrefixCommandsWork = true;

    const description: Array<string> = [];

    const { channel, guild, me, member } = context;
    if (channel) {
      description.push(`**${translate('permcheck.channel_permissions')}**`);
      if (context.inDm) {
        // the bot can always see its own dms, but never dms/group dms between users
        if (context.inDmWithBot) {
          description.push(`-> ${translate('permcheck.send_message')}: ✅`);
          description.push(`-> ${translate('permcheck.view')}: ✅`);
        } else {
          description.push(`-> ${translate('permcheck.send_message')}: ✅`);
          description.push(`-> ${translate('permcheck.view')}: ❌`);
          willPrefixCommandsWork = false;
        }
      } else {
        description.push(`-> ${translate('permcheck.send_message')}: ${(channel.can([Permissions.SEND_MESSAGES])) ? '✅': '❌'}`);
        description.push(`-> ${translate('permcheck.view')}: ${(channel.can([Permissions.VIEW_CHANNEL])) ? '✅': '❌'}`);
        willPrefixCommandsWork = channel.canMessage;
      }
    }

    if (me) {
      if (
        me.communicationDisabledUntilUnix &&
        Date.now() < me.communicationDisabledUntilUnix &&
        !me.canAdministrator
      ) {
        description.push('');
        description.push(`**${translate('permcheck.timed_out')}**`);
        description.push(`-> ${translate('permcheck.can_message')}: ❌`);
        description.push(`-> ${translate('permcheck.until', {time: Markup.timestamp(me.communicationDisabledUntil)})}`);
        willPrefixCommandsWork = false;
      }
      // maybe do other checks here?
    }

    description.push('');
    // prefix commands only need the bot user in the server, not the server install of the slash commands (`isFromGuildInstall`)
    if (context.isBotPresent) {
      if (context.inDmWithBot) {
        description.push(translate('permcheck.bot_dm'));
      } else {
        description.push(translate((context.isFromGuildInstall) ? 'permcheck.installed' : 'permcheck.installed_bot_only'));
      }

      description.push('');
      description.push(`**${translate('permcheck.server_prefixes')}**`);
      if (context.commandClient) {
        const mentionPrefixes = context.commandClient.prefixes.mention.map((x) => Markup.codestring(x));
        description.push('-> ' + mentionPrefixes.join(', '));
      }

      const settings = (guild) ? await GuildSettingsStore.getOrFetch(context, guild.id) : null;
      if (settings && settings.prefixes.length) {
        description.push(`-> ${translate('permcheck.custom_prefixes')}`);
        for (let [x, item] of settings.prefixes) {
          description.push(`--> ${Markup.codestring(item.prefix)}`);
        }
      } else {
        description.push(`-> ${translate('permcheck.default_prefix')}: \`.\``);
      }

      if (settings) {
        description.push('');
        description.push(`**${translate('permcheck.user_permissions')}**`);
        const isAdmin = !!member && (member.isOwner || member.canAdministrator);
        // without a command, only rules covering every command can decide
        const commandId = (args.command) ? getCommandIdFromInvoker(args.command) : '';
        if (context.user.isClientOwner) {
          description.push(`-> ${translate('permcheck.bypass_owner')}`);
        } else if (isAdmin && ((commandId && isGuildRulesCommandId(commandId)) || settings.adminBypassesEverything)) {
          description.push(`-> ${translate('permcheck.bypass_admin')}`);
        } else {
          if (isAdmin) {
            description.push(`-> ${translate('permcheck.bypass_admin_partial')}`);
          }
          // same check as `NotSoCommandClient.onCommandCheck`
          const match = resolveGuildRule(settings, GuildRuleActions.ACCESS, {
            category: (args.command) ? getCommandCategory(context.commandClient, commandId, args.command.metadata && args.command.metadata.category) : null,
            channel: channel || null,
            channelId: context.channelId || null,
            commandId,
            isAdmin,
            member: member || null,
            userId: context.userId,
          });
          if (match) {
            const rule = describeGuildRule(translate, match.rule);
            description.push(`-> ${translate((match.rule.allows) ? 'permcheck.rule_allows' : 'permcheck.rule_blocks', {rule})}: ${(match.rule.allows) ? '✅' : '❌'}`);
            if (!match.rule.allows) {
              willPrefixCommandsWork = false;
            }
          } else if (args.command) {
            description.push(`-> ${translate('permcheck.no_rule', {command: Markup.codestring(args.command.name)})}: ✅`);
          } else {
            description.push(`-> ${translate('permcheck.no_rule_everything')}: ✅`);
          }
          if (!args.command && settings.rules.length) {
            description.push(`-> ${translate('permcheck.rules_check_command')}`);
          }
        }
      }
    } else {
      if (context.inDm) {
        description.push(translate((channel && channel.isDmGroup) ? 'permcheck.group_dm' : 'permcheck.user_dm'));
      } else {
        description.push(translate((context.isFromGuildInstall) ? 'permcheck.installed_commands_only' : 'permcheck.not_installed'));
      }
      willPrefixCommandsWork = false;
    }

    return displayReply(context, {description: [
      translate((willPrefixCommandsWork) ? 'permcheck.will_respond' : 'permcheck.will_not_respond'),
      '',
      description.join('\n'),
    ].join('\n')});
  }
}
