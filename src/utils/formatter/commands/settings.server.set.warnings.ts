import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { editGuildSettings } from '../../../api';
import { GuildSettingsChild } from '../../../api/structures/guildsettings';
import { RestResponsesRaw } from '../../../api/types';
import {
  MAX_GUILD_WARNING_ACTIONS,
  MAX_GUILD_WARNING_USER_AMOUNT,
  StatusEmojis,
  WARNING_ACTION_CLEAN_MAX,
  WARNINGS_EXPIRE_MAX,
  WARNINGS_EXPIRE_MIN,
  WARNINGS_WINDOW_MAX,
  WARNINGS_WINDOW_MIN,
} from '../../../constants';
import { Translator, getCachedTranslator, getTranslator } from '../../i18n';
import { Parameters, displayReply, formatDuration } from '../../../utils';

import * as ModerationBan from './moderation.ban';
import * as ModerationMute from './moderation.mute';
import { formatWarningAction } from './moderation.warn';


export const COMMAND_ID = 'server.set.warnings';

// what `-expire` takes for warnings that never get deleted
export const NEVER_VALUES = ['never', 'off', 'none', '0'];

// a ladder step's action, or taking the step out
export type WarningStepAction = RestResponsesRaw.GuildWarningAction['action'] | 'remove';

// what `-action` takes, english like the other flags
export const ACTION_VALUES: Record<string, WarningStepAction> = {
  ban: 'ban',
  delete: 'remove',
  kick: 'kick',
  mute: 'mute',
  none: 'remove',
  off: 'remove',
  remove: 'remove',
  timeout: 'mute',
};

export interface CommandArgs {
  // with `step`: what happens once a warning brings a member's active warnings to it
  action?: WarningStepAction,
  // seconds of their messages a kick/ban step deletes
  clean?: number,
  // seconds, a mute step's length (1 hour by default) or a ban step's (permanent by default)
  duration?: number,
  // seconds until a warning gets deleted, null: never
  expire?: number | null,
  // active warnings, the ladder step to set or remove
  step?: number,
  // seconds a warning counts as active
  window?: number,
}

// a duration or `never`, nothing given leaves it alone
export function expireParser(value: string, context: Command.Context | Interaction.InteractionContext): number | null | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (NEVER_VALUES.includes(text)) {
    return null;
  }
  return Parameters.secondsWithOptions({float: false})(text, context);
}

export function actionParser(value: string, context: Command.Context | Interaction.InteractionContext): WarningStepAction | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (text in ACTION_VALUES) {
    return ACTION_VALUES[text];
  }
  throw new Error(getCachedTranslator(context).translate('settings_server_set_warnings.invalid_action'));
}

export function durationParser(value: string, context: Command.Context | Interaction.InteractionContext): number | undefined {
  const text = value.trim();
  return (text) ? Parameters.secondsWithOptions({float: false})(text, context) : undefined;
}

export function windowParser(value: string, context: Command.Context | Interaction.InteractionContext): number | undefined {
  const text = value.trim();
  return (text) ? Parameters.secondsWithOptions({float: false})(text, context) : undefined;
}

function formatSettings(translator: Translator, settings: GuildSettingsChild): string {
  const { language, translate } = translator;
  const steps = settings.warningsActions || [];
  return [
    `-> ${translate('moderation_warnings.window', {duration: formatDuration(settings.warningsWindow * 1000, language)})}`,
    `-> ${(settings.warningsExpire) ? translate('settings_server_set_warnings.expire', {duration: formatDuration(settings.warningsExpire * 1000, language)}) : translate('settings_server_set_warnings.expire_never')}`,
    '',
    (steps.length) ? translate('settings_server_set_warnings.actions') : translate('settings_server_set_warnings.actions_off'),
    ...steps.map((step) => {
      return `-> ${translate('settings_server_set_warnings.action_step', {count: step.threshold.toLocaleString(language)})} • ${formatWarningAction(translator, step)}`;
    }),
  ].join('\n');
}

// the ladder with `step` set to `action` (or taken out), or why it can't be
function createSteps(
  translator: Translator,
  steps: Array<RestResponsesRaw.GuildWarningAction>,
  args: CommandArgs,
): Array<RestResponsesRaw.GuildWarningAction> | string {
  const { language, translate } = translator;
  const threshold = args.step!;
  if (!Number.isInteger(threshold) || threshold < 1 || MAX_GUILD_WARNING_USER_AMOUNT < threshold) {
    return translate('settings_server_set_warnings.invalid_step', {max: MAX_GUILD_WARNING_USER_AMOUNT.toLocaleString(language)});
  }
  const others = steps.filter((step) => step.threshold !== threshold);
  if (args.action === 'remove') {
    return others;
  }
  if (MAX_GUILD_WARNING_ACTIONS <= others.length) {
    return translate('settings_server_set_warnings.max_actions', {max: MAX_GUILD_WARNING_ACTIONS.toLocaleString(language)});
  }

  const clean = Math.max(Math.min(args.clean || 0, WARNING_ACTION_CLEAN_MAX), 0);
  let step: RestResponsesRaw.GuildWarningAction;
  switch (args.action) {
    case 'ban': {
      const duration = (args.duration === undefined) ? null : args.duration;
      if (duration !== null && (duration < ModerationBan.TIMED_BAN_MIN_DURATION || ModerationBan.TIMED_BAN_MAX_DURATION < duration)) {
        return translate('moderation_ban.timed_invalid_duration');
      }
      step = {action: 'ban', clean, duration, threshold};
    }; break;
    case 'kick': {
      step = {action: 'kick', clean, duration: null, threshold};
    }; break;
    default: {
      const duration = (args.duration === undefined) ? ModerationMute.DEFAULT_DURATION : args.duration;
      if (duration < 1 || ModerationMute.MAX_DURATION < duration) {
        return translate('moderation_mute.invalid_duration');
      }
      step = {action: 'mute', clean: 0, duration, threshold};
    };
  }
  return [...others, step].sort((x, y) => x.threshold - y.threshold);
}

// shows the server's warning settings, or changes the ones given
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { language, translate } = translator;

  if (args.window !== undefined && (args.window < WARNINGS_WINDOW_MIN || WARNINGS_WINDOW_MAX < args.window)) {
    return displayReply(context, {
      description: `${StatusEmojis.WARNING} ${translate('settings_server_set_warnings.invalid_window', {
        max: formatDuration(WARNINGS_WINDOW_MAX * 1000, language),
        min: formatDuration(WARNINGS_WINDOW_MIN * 1000, language),
      })}`,
      ephemeral: true,
    });
  }
  if (args.expire && (args.expire < WARNINGS_EXPIRE_MIN || WARNINGS_EXPIRE_MAX < args.expire)) {
    return displayReply(context, {
      description: `${StatusEmojis.WARNING} ${translate('settings_server_set_warnings.invalid_expire', {
        max: formatDuration(WARNINGS_EXPIRE_MAX * 1000, language),
        min: formatDuration(WARNINGS_EXPIRE_MIN * 1000, language),
      })}`,
      ephemeral: true,
    });
  }

  // a step and its action go together
  const changingStep = args.step !== undefined || args.action !== undefined;
  if (changingStep && (args.step === undefined || args.action === undefined)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_set_warnings.step_and_action')}`, ephemeral: true});
  }

  let text: string;
  if (args.expire === undefined && args.window === undefined && !changingStep) {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (guildSettings) {
      text = [translate('settings_server_set_warnings.current'), formatSettings(translator, guildSettings.settings)].join('\n');
    } else {
      text = translate('settings_server_set_warnings.error_fetching');
    }
  } else {
    let warningsActions: Array<RestResponsesRaw.GuildWarningAction> | undefined;
    if (changingStep) {
      const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
      if (!guildSettings) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_set_warnings.error_fetching')}`, ephemeral: true});
      }
      const steps = createSteps(translator, guildSettings.settings.warningsActions || [], args);
      if (typeof(steps) === 'string') {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${steps}`, ephemeral: true});
      }
      warningsActions = steps;
    }
    const { settings } = await editGuildSettings(context, context.guildId!, {
      warningsActions,
      warningsExpire: (args.expire === undefined) ? undefined : (args.expire || null),
      warningsWindow: args.window,
    });
    text = [translate('settings_server_set_warnings.updated'), formatSettings(translator, settings)].join('\n');
  }

  return displayReply(context, {description: text, ephemeral: true});
}
