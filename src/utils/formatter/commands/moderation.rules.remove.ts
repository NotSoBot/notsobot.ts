import { Command, Interaction } from 'detritus-client';

import { deleteGuildRules } from '../../../api';
import { getTranslator } from '../../i18n';
import { GuildRuleActions, StatusEmojis } from '../../../constants';
import GuildSettingsStore from '../../../stores/guildsettings';
import { GuildRuleCoverage, describeGuildRule, describeGuildRuleCoverage, displayReply } from '../../../utils';

import { createRulesEmbed } from './moderation.rules';
import { GuildRuleTargets, checkGuildRuleAdmin, getGuildRuleTargets } from './moderation.rules.add';


export const COMMAND_ID = 'server.rules.remove';

export interface CommandArgs extends GuildRuleTargets {
  // what the rules cover, removes the allow or block rule for each target
  coverage?: GuildRuleCoverage | null,
  // or remove rules by id, from `rules list`
  ruleIds?: Array<string> | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);
  const guildId = context.guildId!;
  const settings = (await GuildSettingsStore.getOrFetch(context, guildId))!;

  let rules = settings.rules.toArray();
  if (args.ruleIds && args.ruleIds.length) {
    const ruleIds = new Set(args.ruleIds);
    rules = rules.filter((rule) => ruleIds.has(rule.id));
  } else if (args.coverage) {
    const { coverage } = args;
    const targets = new Set(getGuildRuleTargets(guildId, args).map((target) => `${target.targetType}.${target.targetId}`));
    rules = rules.filter((rule) => {
      return (
        rule.action === GuildRuleActions.ACCESS &&
        (rule.command || null) === coverage.command &&
        (rule.category || null) === coverage.category &&
        targets.has(`${rule.targetType}.${rule.targetId}`)
      );
    });
  } else {
    rules = [];
  }

  if (!rules.length) {
    const description = (args.coverage) ? translate('rules.remove.none_for', {covers: describeGuildRuleCoverage(translate, args.coverage)}) : translate('rules.remove.none');
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`});
  }

  for (let rule of rules) {
    const error = checkGuildRuleAdmin(context, translate, rule);
    if (error) {
      return displayReply(context, {description: `${error}\n-# ${describeGuildRule(translate, rule)}`});
    }
  }

  const updated = await deleteGuildRules(context, guildId, rules.map((rule) => rule.id));
  return createRulesEmbed(context, updated, {
    rules,
    title: translate('rules.remove.title', {count: rules.length.toLocaleString()}),
  });
}
