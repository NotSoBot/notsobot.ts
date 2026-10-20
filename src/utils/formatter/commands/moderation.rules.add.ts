import { Command, Interaction, Structures } from 'detritus-client';

import { putGuildRules, RestOptions } from '../../../api';
import { getTranslator, Translator } from '../../i18n';
import { GuildRuleActions, GuildRuleTargetTypes, StatusEmojis } from '../../../constants';
import { GuildRuleCoverage, describeGuildRuleCoverage, displayReply, guildRuleNeedsAdmin } from '../../../utils';

import { createRulesEmbed, isGuildAdmin } from './moderation.rules';


export const COMMAND_ID = 'server.rules.add';

export interface GuildRuleTargets {
  channels?: Array<Structures.Channel> | null,
  roles?: Array<Structures.Role> | null,
  users?: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs extends GuildRuleTargets {
  // true makes the server owner and admins follow it, false makes them skip it, left out follows the server's setting
  admins?: boolean | null,
  allow: boolean,
  coverage: GuildRuleCoverage,
  message?: string | null,
  // a name that's both a command and a category picks the command, this says how to pick the category instead
  ambiguousCategory?: string | null,
}


// no channels/roles/users is the whole server
export function getGuildRuleTargets(
  guildId: string,
  args: GuildRuleTargets,
): Array<{targetId: string, targetType: GuildRuleTargetTypes}> {
  const targets: Array<{targetId: string, targetType: GuildRuleTargetTypes}> = [];
  for (let channel of args.channels || []) {
    targets.push({targetId: channel.id, targetType: GuildRuleTargetTypes.CHANNEL});
  }
  for (let role of args.roles || []) {
    // @everyone is the whole server
    if (role.id === guildId) {
      targets.push({targetId: guildId, targetType: GuildRuleTargetTypes.GUILD});
    } else {
      targets.push({targetId: role.id, targetType: GuildRuleTargetTypes.ROLE});
    }
  }
  for (let user of args.users || []) {
    targets.push({targetId: user.id, targetType: GuildRuleTargetTypes.USER});
  }
  if (!targets.length) {
    targets.push({targetId: guildId, targetType: GuildRuleTargetTypes.GUILD});
  }
  return targets;
}


// null if they can, otherwise why not
export function checkGuildRuleAdmin(
  context: Command.Context | Interaction.InteractionContext,
  translate: Translator['translate'],
  coverage: GuildRuleCoverage,
  adminBypass?: boolean | null,
): string | null {
  if (guildRuleNeedsAdmin(coverage, adminBypass) && !isGuildAdmin(context.member) && !context.user.isClientOwner) {
    return `${StatusEmojis.WARNING} ${translate('rules.needs_admin')}`;
  }
  return null;
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const guildId = context.guildId!;

  const adminBypass = (typeof(args.admins) === 'boolean') ? !args.admins : undefined;
  const error = checkGuildRuleAdmin(context, translate, args.coverage, adminBypass);
  if (error) {
    return displayReply(context, {description: error});
  }

  const targets = getGuildRuleTargets(guildId, args);
  const rules: Array<RestOptions.PutGuildRule> = targets.map((target) => {
    return {
      action: GuildRuleActions.ACCESS,
      adminBypass,
      category: args.coverage.category,
      command: args.coverage.command,
      targetId: target.targetId,
      targetType: target.targetType,
      value: {allow: args.allow, message: (args.allow) ? null : (args.message || null)},
    };
  });
  const settings = await putGuildRules(context, guildId, rules);

  const keys = new Set(rules.map((rule) => {
    return `${rule.action}.${rule.targetType}.${rule.targetId}.${rule.command || ''}.${rule.category || ''}`;
  }));
  const covers = describeGuildRuleCoverage(translate, args.coverage);
  return createRulesEmbed(context, settings, {
    note: (args.ambiguousCategory) ? translate('rules.ambiguous', {category: describeGuildRuleCoverage(translate, {category: args.ambiguousCategory, command: null}), value: `category:${args.ambiguousCategory.toLowerCase()}`}) : null,
    rules: settings.rules.filter((rule) => keys.has(rule.key)),
    title: translate((args.allow) ? 'rules.add.title_allow' : 'rules.add.title_block', {covers}),
  });
}
