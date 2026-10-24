import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music fair';

// on/off for the music settings, `music vote skip` and `music rules duplicates` take them too
export const ON_OFF_VALUES: Record<string, boolean> = Object.freeze({
  disable: false,
  disabled: false,
  false: false,
  no: false,
  off: false,
  enable: true,
  enabled: true,
  on: true,
  true: true,
  yes: true,
});

// null when it's empty (show the setting), undefined when it's neither
export function parseOnOff(value: string): boolean | null | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return null;
  }
  return (text in ON_OFF_VALUES) ? ON_OFF_VALUES[text] : undefined;
}

export default class MusicFairCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'value',
      metadata: {
        description: 'Make the queue take turns between who queued: everyone\'s first track, then everyone\'s second... (off by default, leave empty to see it). Changing it needs Manage Server or a NotSoMusic role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} on`,
          `${COMMAND_NAME} off`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicFair.COMMAND_ID,
        usage: '(on|off)',
      },
      type: parseOnOff,
    });
  }

  onBeforeRun(context: Command.Context, args: {value?: boolean | null}) {
    return args.value !== undefined;
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.needs_value')}`});
  }

  async run(context: Command.Context, args: {value: boolean | null}) {
    return Formatter.Commands.MusicFair.createMessage(context, {enabled: args.value});
  }
}
