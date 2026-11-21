import { Command, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsRule } from '../../../api/structures/guildsettings';
import { getTranslator, TranslationKey, Translator } from '../../i18n';
import { EmbedColors, GuildPrefixCommandPermissions, GuildRuleTargetTypes, StatusEmojis } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import {
  DisplayPayload,
  Paginator,
  chunkArray,
  describeGuildRule,
  displayDetailsLine,
  displayReply,
  displayTimestamp,
} from '../../../utils';
import { fillApplicationCommandPermissions, getApplicationCommandPermissionsLoaded } from '../../commandpermissions';


export const COMMAND_ID = 'server.rules.list';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs = {},
) {
  const settings = (await GuildSettingsStore.getOrFetch(context, context.guildId!))!;
  return createRulesEmbed(context, settings);
}


// who a rule targets, most specific last, so the list reads from the server down to single users
const TARGET_ORDER: Record<GuildRuleTargetTypes, number> = Object.freeze({
  [GuildRuleTargetTypes.GUILD]: 0,
  [GuildRuleTargetTypes.CHANNEL]: 1,
  [GuildRuleTargetTypes.ROLE]: 2,
  [GuildRuleTargetTypes.USER]: 3,
});

export function sortGuildRules(rules: Array<GuildSettingsRule>): Array<GuildSettingsRule> {
  const coverageOrder = (rule: GuildSettingsRule) => (rule.command) ? 2 : (rule.category) ? 1 : 0;
  return rules.sort((x, y) => {
    return (
      (TARGET_ORDER[x.targetType] - TARGET_ORDER[y.targetType]) ||
      (coverageOrder(x) - coverageOrder(y)) ||
      x.added.localeCompare(y.added)
    );
  });
}


// the rule, then its id, who added it and if the owner/admins follow it as subtext
export function formatGuildRule(
  translate: Translator['translate'],
  settings: GuildSettings,
  rule: GuildSettingsRule,
  index?: number,
): string {
  const lines = [
    `${(index !== undefined) ? `**${index}.** ` : ''}${(rule.allows) ? StatusEmojis.YES : StatusEmojis.NOT_ALLOWED} ${describeGuildRule(translate, rule)}`,
  ];
  if (rule.value.message) {
    lines.push(`-# ${translate('rules.list.message', {message: Markup.escape.all(rule.value.message)})}`);
  }
  lines.push(displayDetailsLine([
    Markup.codestring(rule.id),
    (rule.userId) ? translate('rules.list.added_by', {time: displayTimestamp(rule.added), user: `<@${rule.userId}>`}) : displayTimestamp(rule.added),
    (!settings.canAdminBypass(rule)) ? translate('rules.list.admins_follow') : null,
  ], true));
  return lines.join('\n');
}


export function getAdminBypassLine(translate: Translator['translate'], settings: GuildSettings): string {
  const rulesAdminBypass = (settings.settings) ? settings.settings.rulesAdminBypass : true;
  return `-# ${translate((rulesAdminBypass) ? 'rules.list.admins_skip_all' : 'rules.list.admins_follow_all')}`;
}


const RULES_PER_PAGE = 10;

const INTEGRATIONS_NOTES: Record<GuildPrefixCommandPermissions, TranslationKey> = Object.freeze({
  [GuildPrefixCommandPermissions.OFF]: 'rules.list.integrations_note_slash',
  [GuildPrefixCommandPermissions.COMMANDS]: 'rules.list.integrations_note_commands',
  [GuildPrefixCommandPermissions.ALL]: 'rules.list.integrations_note',
});
// the discord command permissions pages are packed by length, a command can have up to 100 overwrites
const INTEGRATIONS_PAGE_LENGTH = 3500;
const INTEGRATIONS_COMMAND_LENGTH = 1500;


// overwrites covering the whole server first, then channels, roles and users like the rules
function integrationOverwriteOrder(overwrite: Structures.ApplicationCommandPermission): number {
  if (overwrite.isForAllChannels() || overwrite.isForEveryoneRole()) {
    return 0;
  }
  return (overwrite.isChannel) ? 1 : (overwrite.isRole) ? 2 : 3;
}

function describeIntegrationOverwrite(
  translate: Translator['translate'],
  overwrite: Structures.ApplicationCommandPermission,
): string {
  const emoji = (overwrite.permission) ? StatusEmojis.YES : StatusEmojis.NOT_ALLOWED;
  let target: string;
  if (overwrite.isForEveryoneRole()) {
    target = '@everyone';
  } else if (overwrite.isForAllChannels()) {
    target = translate('rules.list.integrations_all_channels');
  } else if (overwrite.isChannel) {
    target = `<#${overwrite.id}>`;
  } else if (overwrite.isRole) {
    target = `<@&${overwrite.id}>`;
  } else {
    target = `<@${overwrite.id}>`;
  }
  return `${emoji} ${target}`;
}


// the server's discord command permissions (Server Settings > Integrations > NotSoBot), a block per command with its
// overwrites. discord applies them to slash commands, prefix commands follow the ones the server picked
// (`prefixCommandPermissions`) before the rules (`NotSoCommandClient.onCommandCheck`). none
// when the server has none, or they can't load (the bot was added without `applications.commands`, so there are none)
export async function formatIntegrationPermissions(
  context: Command.Context | Interaction.InteractionContext,
  translate: Translator['translate'],
): Promise<Array<string>> {
  const guildId = context.guildId!;
  await fillApplicationCommandPermissions(context, guildId).catch(() => null);
  const guildPermissions = context.client.applicationCommandPermissions.get(guildId);
  if (getApplicationCommandPermissionsLoaded(context, guildId) !== true || !guildPermissions || !guildPermissions.length) {
    return [];
  }

  // the global and guild versions of a command both map to it
  const commandsById = new Map<string, {name: string, type: ApplicationCommandTypes}>();
  if (context.interactionCommandClient) {
    for (let command of context.interactionCommandClient.commands) {
      for (let id of command.ids.values()) {
        commandsById.set(id, command);
      }
    }
  }

  const applicationId = context.client.applicationId;
  const blocks = guildPermissions.toArray().map((entry) => {
    let label: string;
    // app-wide first, then by name, ids of deleted commands last
    let sortKey: string;
    const command = commandsById.get(entry.id);
    if (entry.id === applicationId) {
      label = `**${translate('rules.list.integrations_all_commands')}**`;
      sortKey = '0';
    } else if (command) {
      label = (command.type === ApplicationCommandTypes.CHAT_INPUT) ? `</${command.name}:${entry.id}>` : `**${Markup.escape.all(command.name)}**`;
      sortKey = `1${command.name}`;
    } else {
      label = Markup.codestring(entry.id);
      sortKey = `2${entry.id}`;
    }

    const overwrites = entry.permissions.toArray().sort((x, y) => integrationOverwriteOrder(x) - integrationOverwriteOrder(y));
    let details = displayDetailsLine(overwrites.map((overwrite) => describeIntegrationOverwrite(translate, overwrite)), true);
    if (INTEGRATIONS_COMMAND_LENGTH < details.length) {
      details = details.slice(0, details.lastIndexOf(' • ', INTEGRATIONS_COMMAND_LENGTH)) + ' • …';
    }
    return {sortKey, text: `${label}\n${details}`};
  });
  return blocks.sort((x, y) => x.sortKey.localeCompare(y.sortKey)).map((block) => block.text);
}

// packs the command blocks into pages that fit an embed description
function chunkIntegrationBlocks(blocks: Array<string>): Array<Array<string>> {
  const pages: Array<Array<string>> = [];
  let page: Array<string> = [];
  let length = 0;
  for (let block of blocks) {
    if (page.length && INTEGRATIONS_PAGE_LENGTH < length + block.length) {
      pages.push(page);
      page = [];
      length = 0;
    }
    page.push(block);
    length += block.length + 1;
  }
  if (page.length) {
    pages.push(page);
  }
  return pages;
}

export async function createRulesEmbed(
  context: Command.Context | Interaction.InteractionContext,
  settings: GuildSettings,
  // `note` is a small line shown above the rules
  options: {note?: string | null, rules?: Array<GuildSettingsRule>, title?: string} = {},
) {
  const { translate } = await getTranslator(context);
  const rules = sortGuildRules(options.rules || settings.rules.toArray());
  const title = options.title || translate('rules.list.title');
  const adminBypassLine = [getAdminBypassLine(translate, settings), (options.note) ? `-# ${options.note}` : null].filter(Boolean).join('\n');
  // only the full list shows the discord command permissions, not the rules just added/removed
  const integrationPages = (options.rules) ? [] : chunkIntegrationBlocks(await formatIntegrationPermissions(context, translate));

  if (!rules.length && !integrationPages.length) {
    return displayReply(context, {
      color: EmbedColors.DEFAULT,
      description: [translate('rules.list.empty'), adminBypassLine].join('\n'),
      title,
    });
  }

  // the rules first (one page saying there are none), then the discord command permissions
  const rulePages = (rules.length) ? chunkArray<GuildSettingsRule>(rules, RULES_PER_PAGE) : [[]];
  const pageLimit = rulePages.length + integrationPages.length;
  const footer = translate('rules.list.footer', {count: rules.length.toLocaleString()});
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const payload: DisplayPayload = {fields: []};
      payload.color = EmbedColors.DEFAULT;
      if (pageNumber <= rulePages.length) {
        const page = rulePages[pageNumber - 1];
        payload.title = title;
        payload.footer = (pageLimit === 1) ? footer : translate('common.page_of', {page: pageNumber, total: pageLimit}) + ` • ${footer}`;
        payload.description = (page.length) ? [
          adminBypassLine,
          '',
          page.map((rule, i) => formatGuildRule(translate, settings, rule, ((pageNumber - 1) * RULES_PER_PAGE) + i + 1)).join('\n'),
        ].join('\n') : [translate('rules.list.no_rules'), adminBypassLine].join('\n');
      } else {
        const page = integrationPages[pageNumber - rulePages.length - 1];
        payload.title = translate('rules.list.integrations_title');
        payload.footer = translate('common.page_of', {page: pageNumber, total: pageLimit});
        // which of them stop prefix commands too (`/server-rules integrations`)
        const note = translate(INTEGRATIONS_NOTES[settings.prefixCommandPermissions] || 'rules.list.integrations_note_commands');
        payload.description = [`-# ${note}`, '', page.join('\n')].join('\n');
      }
      return {display: payload};
    },
  });
  return await paginator.start();
}


// the server owner and admins, they can add rules covering everything and change the admin bypass
export function isGuildAdmin(member: Structures.Member | null | undefined): boolean {
  return !!member && (member.isOwner || member.canAdministrator);
}
