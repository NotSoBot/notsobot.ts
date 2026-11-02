import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { ON_OFF_VALUES } from './music.fair';


export const COMMAND_NAME = 'music autopause';

const RIGHT_AWAY_VALUES = new Set(['0', 'instant', 'instantly', 'now']);

// `on`/`off` and how long it stays paused before leaving (`30s`, `2m`, `1:30`, `instant`), in either order. Nothing
// shows both, undefined when a word is neither or the length is over 5 minutes
function parseAutopause(value: string): Formatter.Commands.MusicAutopause.CommandArgs | undefined {
  const args: Formatter.Commands.MusicAutopause.CommandArgs = {enabled: null, leaveAfter: null};
  for (const word of value.trim().toLowerCase().split(/\s+/).filter(Boolean)) {
    if (word in ON_OFF_VALUES) {
      args.enabled = ON_OFF_VALUES[word];
      continue;
    }
    let seconds: number;
    if (RIGHT_AWAY_VALUES.has(word)) {
      seconds = 0;
    } else {
      try {
        seconds = Parameters.seconds(word);
      } catch {
        return undefined;
      }
    }
    if (!Number.isFinite(seconds) || seconds < 0 || Formatter.Commands.MusicAutopause.MAX_MUSIC_PAUSE_TIMEOUT < seconds) {
      return undefined;
    }
    args.leaveAfter = seconds;
  }
  return args;
}

export default class MusicAutopauseCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music pausealone', 'music pausetimeout'],
      disableDm: true,
      label: 'value',
      metadata: {
        description: 'The bot pauses when everyone else in the voice channel leaves or deafens (bots don\'t count) and carries on when someone can hear it again, on for every server (only premium servers can turn it `off`). Give a length to pick how long it stays paused before leaving, right away (`instant`) up to 5 minutes (3 by default, 24/7 stays paused). Leave empty to see both. Changing them needs Manage Server or the DJ role',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 30s`,
          `${COMMAND_NAME} instant`,
          `${COMMAND_NAME} off`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicAutopause.COMMAND_ID,
        usage: '(on|off) (<length>|instant)',
      },
      type: parseAutopause,
    });
  }

  onBeforeRun(context: Command.Context, args: {value?: Formatter.Commands.MusicAutopause.CommandArgs}) {
    return args.value !== undefined;
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_autopause.needs_value')}`});
  }

  async run(context: Command.Context, args: {value: Formatter.Commands.MusicAutopause.CommandArgs}) {
    return Formatter.Commands.MusicAutopause.createMessage(context, args.value);
  }
}
