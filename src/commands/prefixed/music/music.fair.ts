import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music fair';

const VALUES: Record<string, boolean> = Object.freeze({
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
        // premium users, premium servers and servers given the feature (`owner guild features add`)
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicFair.COMMAND_ID,
        usage: '(on|off)',
      },
      type: (value: string) => {
        const text = value.trim().toLowerCase();
        if (!text) {
          return null;
        }
        return (text in VALUES) ? VALUES[text] : undefined;
      },
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
