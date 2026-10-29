import { ClusterClient, Collections, ShardClient } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { EventSubscription } from 'detritus-utils';

import { ApiEventsSpewer } from '../apievents';
import { GuildWarningAutoTriggers } from '../constants';
import GuildSettingsStore from '../stores/guildsettings';
import { Formatter, I18n } from '../utils';

import { Listener } from './listener';


// a discord AutoMod rule's name, for the warning's reason (one hit sends an event for each of its actions)
const RULE_NAME_EXPIRE = 10 * 60 * 1000;
const ruleNames = new Collections.BaseCollection<string, Promise<string | null>>({expire: RULE_NAME_EXPIRE});

function fetchRuleName(shard: ShardClient, guildId: string, ruleId: string): Promise<string | null> {
  let name = ruleNames.get(ruleId);
  if (!name) {
    name = shard.rest.fetchGuildAutoModerationRule(guildId, ruleId).then((rule) => rule.name, () => null);
    ruleNames.set(ruleId, name);
  }
  return name;
}


// the server's auto-warn for setting off one of its discord AutoMod rules
class AutomodListener extends Listener {
  create(cluster: ClusterClient, apiEvents: ApiEventsSpewer) {
    const subscriptions: Array<EventSubscription> = [];

    {
      const subscription = cluster.subscribe(ClientEvents.AUTO_MODERATION_ACTION_EXECUTION, async (event) => {
        const { guildId, ruleId, shard, userId } = event;
        const guild = event.guild || shard.guilds.get(guildId);
        if (!guild) {
          return;
        }
        const context = {client: shard, guild, guildId, me: guild.me, rest: shard.rest};
        try {
          const settings = await GuildSettingsStore.getOrFetch(context, guildId);
          if (!settings) {
            return;
          }
          const channelId = event.channelId || null;
          const channel = event.channel || ((channelId) ? shard.channels.get(channelId) || null : null);
          const AutoWarn = Formatter.Commands.ModerationAutowarn;
          const rule = AutoWarn.resolveGuildWarningAuto(settings, GuildWarningAutoTriggers.AUTOMOD, channel, channelId, ruleId);
          if (!rule) {
            return;
          }
          const member = event.member || guild.members.get(userId) || await guild.fetchMember(userId).catch(() => null);
          if (!member) {
            return;
          }

          const audit = await I18n.getGuildTranslator(context as unknown as I18n.LanguageContext);
          const name = await fetchRuleName(shard, guildId, ruleId);
          const reason = AutoWarn.createAutoWarnReason(audit, rule, {
            automodRule: name || audit.translate(`moderation_autowarn.automod_type_${event.ruleTriggerType}` as I18n.TranslationKey),
          });
          // one warning for each of the AutoMod rule's hits, not each of its actions
          const result = await AutoWarn.runAutoWarn(context, {cooldownKey: ruleId, member, reason, rule, settings});
          // a member profile rule has no channel, they only get the dm
          if (result && channel && channel.canMessage) {
            await channel.createMessage({
              allowedMentions: {parse: [], users: [member.id]},
              content: AutoWarn.formatAutoWarnNotice(audit, member, rule, result, reason),
            });
          }
        } catch(error) {
          console.error(`AutoMod auto-warn failed for ${guildId}`, error);
        }
      });
      subscriptions.push(subscription);
    }

    return subscriptions;
  }
}

export default new AutomodListener();
