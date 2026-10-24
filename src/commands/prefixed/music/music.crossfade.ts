import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, GuildFeatures, StatusEmojis } from '../../../constants';
import { Formatter, I18n, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { ON_OFF_VALUES } from './music.fair';


export const COMMAND_NAME = 'music crossfade';

export default class MusicCrossfadeCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music fade'],
      disableDm: true,
      label: 'seconds',
      metadata: {
        description: `Fade the end of each song into the next, up to ${Formatter.Commands.MusicCrossfade.MAX_MUSIC_CROSSFADE} seconds (a premium server perk), \`off\` turns it off, leave empty to see it. Songs play without a gap either way. Changing it needs Manage Server or the DJ role`,
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} 6`,
          `${COMMAND_NAME} off`,
        ],
        category: CommandCategories.MUSIC,
        // premium users, premium servers and servers given the feature, it only fades on a premium server
        premiumServer: GuildFeatures.MUSIC_ACCESS,
        id: Formatter.Commands.MusicCrossfade.COMMAND_ID,
        usage: '(<seconds>|off)',
      },
      // seconds, 0 for off, null shows it, undefined when it's neither
      type: (value: string) => {
        const text = value.trim().toLowerCase().replace(/s$/, '');
        if (!text) {
          return null;
        }
        if (ON_OFF_VALUES[text] === false) {
          return 0;
        }
        const seconds = Number(text);
        return (Number.isFinite(seconds) && 0 <= seconds && seconds <= Formatter.Commands.MusicCrossfade.MAX_MUSIC_CROSSFADE) ? seconds : undefined;
      },
    });
  }

  onBeforeRun(context: Command.Context, args: {seconds?: number | null}) {
    return args.seconds !== undefined;
  }

  async onCancelRun(context: Command.Context) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_crossfade.needs_value', {max: Formatter.Commands.MusicCrossfade.MAX_MUSIC_CROSSFADE})}`});
  }

  async run(context: Command.Context, args: {seconds: number | null}) {
    return Formatter.Commands.MusicCrossfade.createMessage(context, {seconds: args.seconds});
  }
}
