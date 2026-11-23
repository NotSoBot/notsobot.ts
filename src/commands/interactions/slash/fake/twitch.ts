import { Interaction } from 'detritus-client';

import { RestOptions } from '../../../../api/types';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'twitch';

const { BADGES, BADGE_ALIASES, MAX_BADGES, MAX_COLOR_LENGTH, MAX_FROM_LENGTH, MAX_NAME_LENGTH, MAX_TEXT_LENGTH } = Formatter.Commands.FunTwitch;

export interface CommandArgs {
  badges?: Array<RestOptions.MediaICreateTwitchBadge>,
  color?: string,
  from?: string,
  message?: Parameters.QuoteTarget,
  name?: string,
  style?: Formatter.Commands.FunTwitch.CommandArgs['style'],
  text?: string,
  theme?: RestOptions.MediaICreateTwitch['theme'],
  time?: Date,
}

export class TwitchCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a Twitch chat message from anyone, with emotes, badges and a name color';
  descriptionLocalizations = I18n.localizations('commands.fun.twitch.description');
  metadata = {
    id: Formatter.Commands.FunTwitch.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.twitch.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'What it says',
          ...I18n.optionLocalizations('commands.fun.quote.text'),
          maxLength: MAX_TEXT_LENGTH,
          value: Parameters.string({maxLength: MAX_TEXT_LENGTH}),
        },
        {
          name: 'from',
          description: 'Who it\'s from: a @mention, or a real account\'s handle on the site (Default: you)',
          ...I18n.optionLocalizations('commands.fun.post.from'),
          maxLength: MAX_FROM_LENGTH,
          // members here and the accounts already known are offered, any other mention or login can still be typed
          onAutoComplete: Formatter.Commands.FunTweet.autocompleteFrom('twitch'),
          value: Parameters.string({maxLength: MAX_FROM_LENGTH}),
        },
        {
          // by itself it's the chat message, with text it's the one the text replies to
          name: 'message',
          description: 'A message link or id: by itself it becomes the post, with text it is quoted',
          ...I18n.optionLocalizations('commands.fun.post.message'),
          value: Parameters.quote,
        },
        {
          name: 'name',
          description: 'The display name',
          ...I18n.optionLocalizations('commands.fun.post.name'),
          maxLength: MAX_NAME_LENGTH,
          value: Parameters.string({maxLength: MAX_NAME_LENGTH}),
        },
        {
          name: 'color',
          description: 'The name\'s color: a color name, #hex or r,g,b',
          ...I18n.optionLocalizations('commands.fun.quote.color'),
          maxLength: MAX_COLOR_LENGTH,
          value: Parameters.string({maxLength: MAX_COLOR_LENGTH}),
        },
        {
          // one text option: discord has no option that takes a few choices at once
          name: 'badges',
          description: 'Badges before the name, up to 5: broadcaster mod vip sub partner prime turbo bits staff, or none',
          ...I18n.optionLocalizations('commands.fun.twitch.badges'),
          maxLength: 100,
          value: Parameters.flagChoices(BADGES, {aliases: BADGE_ALIASES, max: MAX_BADGES}),
        },
        {
          name: 'style',
          description: 'How chat marks it: a channel points highlight, or a first-time chatter',
          ...I18n.optionLocalizations('commands.fun.twitch.style'),
          choices: Parameters.Slash.oneOf({
            choices: {HIGHLIGHT: 'highlight', FIRST: 'first'},
            descriptions: {first: 'First-Time Chatter', highlight: 'Highlighted Message'},
            doNotSort: true,
          }),
        },
        {
          // the chat hides the time unless it's turned on, so it's only drawn when this is set
          name: 'time',
          description: 'When it was sent, like "jan 6 2021 9:41am" or "2 hours ago" (Default: now)',
          ...I18n.optionLocalizations('commands.fun.post.time'),
          value: Parameters.timestampAny,
        },
        {
          name: 'theme',
          description: 'The site\'s color theme',
          ...I18n.optionLocalizations('commands.fun.post.theme'),
          choices: Parameters.Slash.oneOf({
            choices: {DARK: 'dark', LIGHT: 'light'},
            defaultChoice: 'dark',
            doNotSort: true,
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.FunTwitch.createMessage(context, {
      badges: args.badges,
      color: args.color,
      from: args.from,
      message: (args.message) ? args.message.message : null,
      name: args.name,
      style: args.style,
      text: args.text,
      theme: args.theme,
      time: args.time,
    });
  }
}
