import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { editGuildSettings } from '../../../api';
import { GuildSettingsChild } from '../../../api/structures/guildsettings';
import { StatusEmojis, WARNINGS_EXPIRE_MAX, WARNINGS_EXPIRE_MIN, WARNINGS_WINDOW_MAX, WARNINGS_WINDOW_MIN } from '../../../constants';
import { Translator, getTranslator } from '../../i18n';
import { Parameters, displayReply, formatDuration } from '../../../utils';


export const COMMAND_ID = 'server.set.warnings';

// what `-expire` takes for warnings that never get deleted
export const NEVER_VALUES = ['never', 'off', 'none', '0'];

export interface CommandArgs {
  // seconds until a warning gets deleted, null: never
  expire?: number | null,
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

export function windowParser(value: string, context: Command.Context | Interaction.InteractionContext): number | undefined {
  const text = value.trim();
  return (text) ? Parameters.secondsWithOptions({float: false})(text, context) : undefined;
}

function formatSettings(translator: Translator, settings: GuildSettingsChild): string {
  const { language, translate } = translator;
  return [
    `-> ${translate('moderation_warnings.window', {duration: formatDuration(settings.warningsWindow * 1000, language)})}`,
    `-> ${(settings.warningsExpire) ? translate('settings_server_set_warnings.expire', {duration: formatDuration(settings.warningsExpire * 1000, language)}) : translate('settings_server_set_warnings.expire_never')}`,
  ].join('\n');
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

  let text: string;
  if (args.expire === undefined && args.window === undefined) {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (guildSettings) {
      text = [translate('settings_server_set_warnings.current'), formatSettings(translator, guildSettings.settings)].join('\n');
    } else {
      text = translate('settings_server_set_warnings.error_fetching');
    }
  } else {
    const { settings } = await editGuildSettings(context, context.guildId!, {
      warningsExpire: (args.expire === undefined) ? undefined : (args.expire || null),
      warningsWindow: args.window,
    });
    text = [translate('settings_server_set_warnings.updated'), formatSettings(translator, settings)].join('\n');
  }

  return displayReply(context, {description: text, ephemeral: true});
}
