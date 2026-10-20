import { Command, CommandClient, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import type { GuildSettings, GuildSettingsRule } from '../api/structures/guildsettings';
import {
  CommandCategories,
  CommandCategoryNames,
  GuildRuleActions,
  GuildRuleTargetTypes,
  SLASH_COMMAND_CATEGORY_FALLBACKS,
} from '../constants';

import type { Translator } from './i18n';
import { prefixedCommand } from './parameters';
import { getCommandIdFromInvoker } from './tools';


// what a rule covers, a command, a category or (both null) everything
export interface GuildRuleCoverage {
  // a CommandCategories
  category: string | null,
  command: string | null,
}

// what a command run is checked against
export interface GuildRuleSubject {
  category: string | null,
  channel: Structures.Channel | null,
  channelId: string | null,
  commandId: string,
  // the server owner or an administrator, they skip rules the server lets them bypass
  isAdmin: boolean,
  member: Structures.Member | null,
  userId: string,
}

// how a rule's target matched, a channel rule also covers threads in it and channels in a category
export type GuildRuleMatchedVia = 'channel' | 'grandparent' | 'guild' | 'parent' | 'role' | 'user';

export interface GuildRuleMatch {
  rule: GuildSettingsRule,
  via: GuildRuleMatchedVia,
}

// who/where decides first, users over roles over channels over the server
const TARGET_RANKS: Record<GuildRuleMatchedVia, number> = Object.freeze({
  guild: 0,
  grandparent: 1,
  parent: 2,
  channel: 3,
  role: 4,
  user: 5,
});

// the categories a rule can cover, bot owner commands can't be blocked
export const GUILD_RULE_CATEGORIES: ReadonlyArray<CommandCategories> = Object.freeze(
  (Object.values(CommandCategories) as Array<CommandCategories>)
    .filter((category) => category !== CommandCategories.OWNER)
    .sort((x, y) => CommandCategoryNames[x].localeCompare(CommandCategoryNames[y])),
);


function matchGuildRuleTarget(rule: GuildSettingsRule, subject: GuildRuleSubject): GuildRuleMatchedVia | null {
  switch (rule.targetType) {
    case GuildRuleTargetTypes.CHANNEL: {
      if (rule.targetId === subject.channelId) {
        return 'channel';
      }
      const { channel } = subject;
      if (channel && channel.parentId === rule.targetId) {
        return 'parent';
      }
      const parent = (channel) ? channel.parent : null;
      if (parent && parent.parentId === rule.targetId) {
        return 'grandparent';
      }
    }; break;
    case GuildRuleTargetTypes.GUILD: {
      return 'guild';
    };
    case GuildRuleTargetTypes.ROLE: {
      if (subject.member && subject.member.roles.has(rule.targetId)) {
        return 'role';
      }
    }; break;
    case GuildRuleTargetTypes.USER: {
      if (rule.targetId === subject.userId) {
        return 'user';
      }
    }; break;
  }
  return null;
}


// how specific what the rule covers is, null if it doesn't cover the command
function matchGuildRuleCoverage(rule: GuildSettingsRule, subject: GuildRuleSubject): number | null {
  if (rule.command) {
    return (rule.command === subject.commandId) ? 2 : null;
  }
  if (rule.category) {
    return (rule.category === subject.category) ? 1 : null;
  }
  return 0;
}


/**
 * The rule that decides `action` for this command run: the most specific one that matches. Who/where it targets
 * decides first (user > role > channel > its parent > its parent's parent > server), then what it covers
 * (command > category > everything). Equally specific access rules that disagree (two roles) block.
 * Rules the owner/admins bypass are skipped for them.
 */
export function resolveGuildRule(
  settings: GuildSettings,
  action: GuildRuleActions,
  subject: GuildRuleSubject,
): GuildRuleMatch | null {
  let best: GuildRuleMatch | null = null;
  let bestRank = -1;
  for (let [ruleId, rule] of settings.rules) {
    if (rule.action !== action) {
      continue;
    }
    if (subject.isAdmin && settings.canAdminBypass(rule)) {
      continue;
    }
    const coverage = matchGuildRuleCoverage(rule, subject);
    if (coverage === null) {
      continue;
    }
    const via = matchGuildRuleTarget(rule, subject);
    if (!via) {
      continue;
    }
    const rank = TARGET_RANKS[via] * 3 + coverage;
    if (bestRank < rank || (rank === bestRank && best && best.rule.allows && !rule.allows)) {
      best = {rule, via};
      bestRank = rank;
    }
  }
  return best;
}


// the command's category, its own (or the slash command's), else the prefixed command with the same id, else the
// slash fallbacks (same order as `owner.upload.commands`)
export function getCommandCategory(
  commandClient: CommandClient | null | undefined,
  commandId: string,
  explicit?: string | null,
): string | null {
  if (explicit) {
    return explicit;
  }
  if (commandClient) {
    const command = commandClient.commands.find((x) => !!x.metadata && x.metadata.id === commandId);
    if (command && command.metadata.category) {
      return command.metadata.category;
    }
  }
  const fallback = SLASH_COMMAND_CATEGORY_FALLBACKS.find(([prefix]) => commandId.startsWith(prefix));
  return (fallback) ? fallback[1] : null;
}


export function findGuildRuleCategory(value: string): CommandCategories | null {
  const text = value.trim().toLowerCase();
  if (!text) {
    return null;
  }
  for (let category of GUILD_RULE_CATEGORIES) {
    if (category.toLowerCase() === text || CommandCategoryNames[category].toLowerCase() === text) {
      return category;
    }
  }
  return null;
}


const EVERYTHING_ALIASES = Object.freeze(['*', 'all', 'everything', 'every command', 'all commands']);

export interface ParsedGuildRuleCoverage {
  // a bare name that's both a command and a category, the command was picked
  ambiguousCategory: CommandCategories | null,
  coverage: GuildRuleCoverage,
}

/**
 * `everything`/`all`/`*`, `category:fun` (or the category's name), `command:ship` (or the command's name).
 * A bare name that's both a command and a category is the command, `category:` picks the category.
 * Null if nothing matched.
 */
export async function parseGuildRuleCoverage(
  context: Command.Context | Interaction.InteractionContext,
  value: string,
): Promise<ParsedGuildRuleCoverage | null> {
  const text = value.trim();
  if (EVERYTHING_ALIASES.includes(text.toLowerCase())) {
    return {ambiguousCategory: null, coverage: {category: null, command: null}};
  }

  const prefixMatch = /^(category|cat|command|cmd):\s*(.+)$/i.exec(text);
  if (prefixMatch) {
    const [, kind, rest] = prefixMatch;
    if (['cat', 'category'].includes(kind.toLowerCase())) {
      const category = findGuildRuleCategory(rest);
      return (category) ? {ambiguousCategory: null, coverage: {category, command: null}} : null;
    }
    const command = await prefixedCommand(rest, context);
    return (command) ? {ambiguousCategory: null, coverage: {category: null, command: getCommandIdFromInvoker(command)}} : null;
  }

  const category = findGuildRuleCategory(text);
  const command = await prefixedCommand(text, context);
  if (command) {
    return {ambiguousCategory: category, coverage: {category: null, command: getCommandIdFromInvoker(command)}};
  }
  if (category) {
    return {ambiguousCategory: null, coverage: {category, command: null}};
  }
  return null;
}


// rules covering everything (what the server allow/blocklists were) and the owner/admin bypass need administrator
export function guildRuleNeedsAdmin(coverage: GuildRuleCoverage, adminBypass?: boolean | null): boolean {
  return (!coverage.command && !coverage.category) || adminBypass === false;
}


export function describeGuildRuleCoverage(
  translate: Translator['translate'],
  coverage: GuildRuleCoverage,
): string {
  if (coverage.command) {
    return translate('rules.covers.command', {command: Markup.codestring(coverage.command)});
  }
  if (coverage.category) {
    const name = CommandCategoryNames[coverage.category as CommandCategories] || coverage.category;
    return translate('rules.covers.category', {category: `**${name}**`});
  }
  return translate('rules.covers.everything');
}


export function describeGuildRuleTarget(
  translate: Translator['translate'],
  rule: {targetId: string, targetType: GuildRuleTargetTypes},
): string {
  switch (rule.targetType) {
    case GuildRuleTargetTypes.CHANNEL: return `<#${rule.targetId}>`;
    case GuildRuleTargetTypes.GUILD: return translate('rules.targets.server');
    case GuildRuleTargetTypes.ROLE: return `<@&${rule.targetId}>`;
    case GuildRuleTargetTypes.USER: return `<@${rule.targetId}>`;
  }
  return rule.targetId;
}


// "Block **Fun** in #general", "Allow everything for @Mods"
export function describeGuildRule(translate: Translator['translate'], rule: GuildSettingsRule): string {
  const covers = describeGuildRuleCoverage(translate, rule);
  const target = describeGuildRuleTarget(translate, rule);
  switch (rule.targetType) {
    case GuildRuleTargetTypes.CHANNEL: {
      return translate((rule.allows) ? 'rules.describe.allow_in' : 'rules.describe.block_in', {covers, target});
    };
    case GuildRuleTargetTypes.GUILD: {
      return translate((rule.allows) ? 'rules.describe.allow_server' : 'rules.describe.block_server', {covers});
    };
  }
  return translate((rule.allows) ? 'rules.describe.allow_for' : 'rules.describe.block_for', {covers, target});
}
