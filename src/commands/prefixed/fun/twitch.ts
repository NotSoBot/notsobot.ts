import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'twitch';

const { BADGES, BADGE_ALIASES, MAX_BADGES, MAX_COLOR_LENGTH, MAX_FROM_LENGTH, MAX_NAME_LENGTH } = Formatter.Commands.FunTwitch;

export interface CommandArgsBefore extends Omit<Formatter.Commands.FunTwitch.CommandArgs, 'message' | 'style' | 'text' | 'theme' | 'user'> {
  first?: boolean,
  highlight?: boolean,
  light?: boolean,
  target: Parameters.QuoteTarget,
}

export default class TwitchCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['twitchchat'],
      args: [
        {name: 'badges', aliases: ['badge'], type: Parameters.flagChoices(BADGES, {aliases: BADGE_ALIASES, max: MAX_BADGES}), metadata: {description: `up to ${MAX_BADGES} badges before the name (${BADGES.join(', ')}), or none`}},
        {name: 'color', aliases: ['c', 'colour'], type: Parameters.string({maxLength: MAX_COLOR_LENGTH}), metadata: {description: 'the name\'s color, a name, #hex or r,g,b'}},
        {name: 'first', type: Boolean, metadata: {description: 'the first-time chatter frame'}},
        {name: 'from', aliases: ['f'], type: Parameters.string({maxLength: MAX_FROM_LENGTH}), metadata: {description: 'who it\'s from: a @mention, or a real twitch account (its name, color and partner badge are copied)'}},
        {name: 'highlight', type: Boolean, metadata: {description: 'a channel points highlighted message'}},
        {name: 'light', type: Boolean, metadata: {description: 'twitch\'s light theme'}},
        {name: 'name', aliases: ['n'], type: Parameters.string({maxLength: MAX_NAME_LENGTH}), metadata: {description: 'the display name'}},
        {name: 'time', aliases: ['t'], type: Parameters.timestampAny, metadata: {description: 'show when it was sent, like "9:41am" or "2 hours ago" (chat hides the time without it)'}},
      ],
      label: 'target',
      metadata: {
        category: CommandCategories.FAKE,
        description: 'Make an image of a Twitch chat message from you, someone here or any real account, with emotes, badges and your own name color',
        examples: [
          `${COMMAND_NAME} hello chat Kappa`,
          `${COMMAND_NAME} @notsobot I'm a bot MrDestructoid -badges mod sub`,
          `${COMMAND_NAME} Chat is this real -from xqc`,
          `${COMMAND_NAME} KEKW OMEGALUL -name Some_Body -color hotpink -badges vip`,
          `${COMMAND_NAME} /me waves at chat -time 9:41am`,
          `${COMMAND_NAME} can I get a hello -highlight -light`,
          `${COMMAND_NAME} https://discord.com/channels/178313653177548800/178313653177548800/1563424004654633000`,
        ],
        id: Formatter.Commands.FunTwitch.COMMAND_ID,
        usage: '<text | @user [text] | message link [text]> (-from <@user|login>) (-name <text>) (-color <name|#hex|r,g,b>) (-badges <badge ...|none>) (-highlight) (-first) (-time <text>) (-light)',
      },
      type: Parameters.postTarget,
    });
  }

  // a reply with nothing else is enough, its message is the line
  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!(args.target.message || args.target.text);
  }

  run(context: Command.Context, args: CommandArgsBefore) {
    return Formatter.Commands.FunTwitch.createMessage(context, {
      badges: args.badges,
      color: args.color,
      from: args.from,
      message: args.target.message,
      name: args.name,
      style: (args.highlight) ? 'highlight' : ((args.first) ? 'first' : undefined),
      text: args.target.text,
      theme: (args.light) ? 'light' : 'dark',
      time: args.time,
      user: args.target.user,
    });
  }
}
