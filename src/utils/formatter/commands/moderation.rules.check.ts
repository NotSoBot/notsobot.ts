import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { getTranslator } from '../../i18n';
import { CommandCategories, CommandCategoryNames, EmbedColors, GuildRuleActions } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import {
  displayReply,
  getCommandCategory,
  getCommandIdFromInvoker,
  isGuildRulesCommandId,
  resolveGuildRule,
} from '../../../utils';

import { formatGuildRule, isGuildAdmin } from './moderation.rules';


export const COMMAND_ID = 'server.rules.check';

export interface CommandArgs {
  channel?: Structures.Channel | null,
  command: Command.Command,
  // who to check for, defaults to whoever ran it
  user?: Structures.Member | Structures.User | null,
}

// which rule decides if `user` can use `command` in `channel`, and why
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const guildId = context.guildId!;
  const settings = (await GuildSettingsStore.getOrFetch(context, guildId))!;

  const channel = args.channel || context.channel || null;
  const user = args.user || context.member || context.user;
  const member = (user instanceof Structures.Member) ? user : (context.guild && context.guild.members.get(user.id)) || null;
  const commandId = getCommandIdFromInvoker(args.command);
  const category = getCommandCategory(context.commandClient, commandId, args.command.metadata && args.command.metadata.category);
  const isAdmin = isGuildAdmin(member);

  const subject = `${Markup.codestring(args.command.name)} • <@${user.id}> • ${(channel) ? `<#${channel.id}>` : translate('rules.targets.server')}`;
  const lines: Array<string> = [`-# ${subject}`, ''];
  if (isAdmin && isGuildRulesCommandId(commandId)) {
    lines.push(`✅ ${translate('rules.check.rules_command')}`);
  } else {
    const match = resolveGuildRule(settings, GuildRuleActions.ACCESS, {
      category,
      channel,
      channelId: (channel) ? channel.id : null,
      commandId,
      isAdmin,
      member,
      userId: user.id,
    });
    if (match) {
      lines.push(`${(match.rule.allows) ? '✅' : '⛔'} ${translate((match.rule.allows) ? 'rules.check.allowed_by' : 'rules.check.blocked_by')}`);
      lines.push(formatGuildRule(translate, settings, match.rule));
      switch (match.via) {
        case 'parent':
        case 'grandparent': {
          lines.push(`-# ${translate('rules.check.via_parent', {channel: `<#${match.rule.targetId}>`})}`);
        }; break;
      }
    } else {
      lines.push(`✅ ${translate('rules.check.no_rule')}`);
    }
    if (isAdmin) {
      const skipped = settings.rules.filter((rule) => rule.action === GuildRuleActions.ACCESS && settings.canAdminBypass(rule)).length;
      if (skipped) {
        lines.push(`-# ${translate('rules.check.admin_skips', {count: skipped.toLocaleString()})}`);
      }
    }
  }
  if (category) {
    const name = CommandCategoryNames[category as CommandCategories] || category;
    lines.push('', `-# ${translate('rules.check.category', {category: `**${name}**`, command: Markup.codestring(args.command.name)})}`);
  }

  return displayReply(context, {
    color: EmbedColors.DEFAULT,
    description: lines.join('\n'),
    title: translate('rules.check.title'),
  });
}
