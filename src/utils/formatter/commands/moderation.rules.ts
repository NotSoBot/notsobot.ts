import { Command, Interaction, Structures } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { GuildSettings, GuildSettingsRule } from '../../../api/structures/guildsettings';
import { getTranslator, Translator } from '../../i18n';
import { EmbedColors, GuildRuleTargetTypes } from '../../../constants';
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
    `${(index !== undefined) ? `**${index}.** ` : ''}${(rule.allows) ? '✅' : '⛔'} ${describeGuildRule(translate, rule)}`,
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

  if (!rules.length) {
    return displayReply(context, {
      color: EmbedColors.DEFAULT,
      description: [translate('rules.list.empty'), adminBypassLine].join('\n'),
      title,
    });
  }

  const pages = chunkArray<GuildSettingsRule>(rules, RULES_PER_PAGE);
  const pageLimit = pages.length;
  const footer = translate('rules.list.footer', {count: rules.length.toLocaleString()});
  const paginator = new Paginator(context, {
    pageLimit,
    onPage: (pageNumber) => {
      const page = pages[pageNumber - 1];
      const payload: DisplayPayload = {fields: []};
      payload.color = EmbedColors.DEFAULT;
      payload.title = title;
      payload.footer = (pageLimit === 1) ? footer : translate('common.page_of', {page: pageNumber, total: pageLimit}) + ` • ${footer}`;
      payload.description = [
        adminBypassLine,
        '',
        page.map((rule, i) => formatGuildRule(translate, settings, rule, ((pageNumber - 1) * RULES_PER_PAGE) + i + 1)).join('\n'),
      ].join('\n');
      return {display: payload};
    },
  });
  return await paginator.start();
}


// the server owner and admins, they can add rules covering everything and change the admin bypass
export function isGuildAdmin(member: Structures.Member | null | undefined): boolean {
  return !!member && (member.isOwner || member.canAdministrator);
}
