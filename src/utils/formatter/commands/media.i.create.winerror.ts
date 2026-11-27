import { Command, Interaction } from 'detritus-client';

import { mediaICreateWinError, mediaICreateWinErrorIcons } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, mediaReply } from '../../../utils';
import { UserError } from '../../errors';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'media.i.create.winerror';
export const ICONS_COMMAND_ID = 'media.i.create.winerror.icons';

// the renderer is their winerr (https://shikoshib.ru/tools/winerr), run by the api
export const CREDITS = [{name: 'shikoshib', url: 'https://github.com/shikoshib/winerr'}];

// the api's system ids (winerr's) and how they're shown
export const WinErrorSystems = Object.freeze({
  WIN_1: 'win1',
  WIN_3: 'win3',
  WIN_31: 'win31',
  WIN_95: 'win95',
  WIN_98: 'win98',
  WIN_2000: 'win2k',
  WHISTLER: 'winwh',
  XP: 'winxp',
  LONGHORN: 'winlh-4093',
  VISTA_BASIC: 'winvista',
  VISTA_AERO: 'win7',
  WIN_8: 'win8',
  WIN_10: 'win10',
  WIN_11: 'win11',
});

export const WinErrorSystemsToText = Object.freeze({
  [WinErrorSystems.WIN_1]: 'Windows 1.0/2.0',
  [WinErrorSystems.WIN_3]: 'Windows 3.0',
  [WinErrorSystems.WIN_31]: 'Windows 3.1',
  [WinErrorSystems.WIN_95]: 'Windows 95',
  [WinErrorSystems.WIN_98]: 'Windows 98',
  [WinErrorSystems.WIN_2000]: 'Windows 2000',
  [WinErrorSystems.WHISTLER]: 'Windows Whistler',
  [WinErrorSystems.XP]: 'Windows XP',
  [WinErrorSystems.LONGHORN]: 'Windows Longhorn 4093',
  [WinErrorSystems.VISTA_BASIC]: 'Windows Vista/7 Basic',
  [WinErrorSystems.VISTA_AERO]: 'Windows Vista/7 Aero',
  [WinErrorSystems.WIN_8]: 'Windows 8/8.1',
  [WinErrorSystems.WIN_10]: 'Windows 10',
  [WinErrorSystems.WIN_11]: 'Windows 11',
});

// what `-os` takes besides the ids, `windows` and spaces dropped first
const SYSTEM_ALIASES: Record<string, string> = Object.freeze({
  '1': 'win1', '1.0': 'win1', '2': 'win1', '2.0': 'win1',
  '3': 'win3', '3.0': 'win3', '3.1': 'win31', '31': 'win31',
  '95': 'win95', '98': 'win98', '2000': 'win2k', '2k': 'win2k',
  'whistler': 'winwh', 'xp': 'winxp', 'longhorn': 'winlh-4093', 'lh': 'winlh-4093',
  'vista': 'win7', '7': 'win7', 'aero': 'win7', 'vistabasic': 'winvista', '7basic': 'winvista', 'basic': 'winvista',
  '8': 'win8', '8.1': 'win8', '10': 'win10', '11': 'win11',
});

export const WIN_ERROR_ICONS = ['error', 'warning', 'question'];

export function parseSystem(value: string): string | null {
  const key = value.toLowerCase().replace(/windows|[\s_-]/g, '').replace(/^win(?=\d)/, '');
  const systems: Array<string> = Object.values(WinErrorSystems);
  if (systems.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }
  return SYSTEM_ALIASES[key] || null;
}

// `#rrggbb`, `rrggbb`, `#rgb` or `r,g,b`
export function parseColor(value: string): number | null {
  const text = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{6}$/i.test(text)) {
    return parseInt(text, 16);
  }
  if (/^[0-9a-f]{3}$/i.test(text)) {
    return parseInt(text.split('').map((x) => x + x).join(''), 16);
  }
  const parts = text.split(/\s*,\s*/).map((x) => Number(x));
  if (parts.length === 3 && parts.every((x) => Number.isInteger(x) && 0 <= x && x <= 255)) {
    return (parts[0] << 16) + (parts[1] << 8) + parts[2];
  }
  return null;
}

// `1,3` or `1 3`
function parseNumbers(value: string): Array<number> {
  return value.split(/[\s,]+/).filter(Boolean).map((x) => parseInt(x)).filter((x) => 1 <= x && x <= 3);
}

export interface CommandArgs {
  buttons?: string,
  color?: string,
  default?: number,
  disabled?: string,
  gradient?: string,
  icon?: string,
  noclose?: boolean,
  os?: string,
  scale?: number,
  text: string,
  title?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  let system: string | undefined;
  if (args.os) {
    system = parseSystem(args.os) || undefined;
    if (!system) {
      throw new UserError(translate('media.winerror.unknown_system', {systems: Object.values(WinErrorSystemsToText).join(', ')}));
    }
  }

  let icon: string | undefined;
  if (args.icon) {
    icon = args.icon.trim().toLowerCase();
    if (!WIN_ERROR_ICONS.includes(icon) && !/^[1-9][0-9]{0,3}$/.test(icon)) {
      throw new UserError(translate('media.winerror.bad_icon'));
    }
  }

  let frameColor: number | undefined;
  if (args.color) {
    const color = parseColor(args.color);
    if (color === null) {
      throw new UserError(translate('media.winerror.bad_color', {color: args.color.slice(0, 32)}));
    }
    frameColor = color;
  }

  let gradientColors: Array<number> | undefined;
  if (args.gradient) {
    // `#800000 #ff8000`, `#800000,#ff8000` (an `r,g,b` one has to be alone)
    const values = (/^\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$/.test(args.gradient)) ? [args.gradient] : args.gradient.split(/[\s,]+/).filter(Boolean);
    gradientColors = [];
    for (const value of values.slice(0, 2)) {
      const color = parseColor(value);
      if (color === null) {
        throw new UserError(translate('media.winerror.bad_color', {color: value.slice(0, 32)}));
      }
      gradientColors.push(color);
    }
  }

  const disabled = (args.disabled) ? parseNumbers(args.disabled) : [];
  const names = (args.buttons !== undefined) ? args.buttons.split('|').map((x) => x.trim()).filter(Boolean) : ['OK'];
  if (3 < names.length) {
    throw new UserError(translate('media.winerror.too_many_buttons'));
  }
  const buttons = names.map((name, index) => ({
    disabled: disabled.includes(index + 1),
    name: name.slice(0, 32),
    recommended: (args.default !== undefined) ? args.default === index + 1 : index === 0,
  }));

  const response = await mediaICreateWinError(context, {
    buttons,
    closeDisabled: args.noclose,
    frameColor,
    gradientColors,
    icon,
    safe: DefaultParameters.safe(context),
    scale: args.scale,
    system,
    text: args.text,
    title: (args.title !== undefined) ? args.title : 'Error',
  });
  return mediaReply(context, response);
}


export interface IconsCommandArgs {
  os?: string,
}

export async function createIconsMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: IconsCommandArgs,
) {
  let system: string | undefined;
  if (args.os) {
    system = parseSystem(args.os) || undefined;
    if (!system) {
      const { translate } = await getTranslator(context);
      throw new UserError(translate('media.winerror.unknown_system', {systems: Object.values(WinErrorSystemsToText).join(', ')}));
    }
  }
  const response = await mediaICreateWinErrorIcons(context, {system});
  return mediaReply(context, response);
}
