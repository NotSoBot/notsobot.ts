import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';

import { PostCommandArgs, postArgs, postEndOptions, postOptions } from '../fake-post/post';


export const COMMAND_NAME = 'steam';

const { MAX_TEXT_LENGTH } = Formatter.Commands.FunTweet;
const { MAX_GAME_LENGTH } = Formatter.Commands.FunSteamreview;

export interface CommandArgs extends PostCommandArgs {
  funny?: number,
  game?: string,
  helpful?: number,
  hours?: number,
  products?: number,
  recommended?: boolean,
}

// a count typed like people write them (`12.5k`), the review's own ones
function countOption(name: string, description: string): Interaction.InteractionCommandOptionOptions {
  return {
    name,
    description,
    ...I18n.optionLocalizations(`commands.fun.steamreview.${name}`),
    maxLength: 16,
    value: Parameters.count,
  };
}

export class SteamCommand extends BaseInteractionCommandOption {
  description = 'Make an image of a Steam review from anyone, with your own text, game, hours and thumb';
  descriptionLocalizations = I18n.localizations('commands.fun.steamreview.description');
  metadata = {
    id: Formatter.Commands.FunSteamreview.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.fun.steamreview.name');

  constructor() {
    // a review is only text: no handle, image or likes, and a message is never quoted beside text
    const [ from, ...who ] = postOptions('steam', ['text', 'message', 'handle', 'image', 'image-url', 'likes']);
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
          name: 'game',
          description: 'Game Name or Application ID',
          ...I18n.optionLocalizations('commands.info.playing.game'),
          maxLength: MAX_GAME_LENGTH,
          // steam's own matches are offered, a name it doesn't have (or a store link) can still be typed
          onAutoComplete: Formatter.Commands.FunSteamreview.autocompleteGame,
          value: Parameters.string({maxLength: MAX_GAME_LENGTH}),
        },
        {
          name: 'recommended',
          description: 'Thumbs up or thumbs down (Default: up)',
          ...I18n.optionLocalizations('commands.fun.steamreview.recommended'),
          type: Boolean,
        },
        {
          name: 'hours',
          description: 'Hours played, like 0.3, 12 hrs or 4,812.5 (Default: made up)',
          ...I18n.optionLocalizations('commands.fun.steamreview.hours'),
          // a string so `4,812.5` and `12 hrs` can be typed
          maxLength: 16,
          value: Parameters.hours,
        },
        from,
        {
          name: 'message',
          description: 'A message link or id to quote',
          ...I18n.optionLocalizations('commands.fun.quote.message'),
          value: Parameters.quote,
        },
        ...who,
        countOption('helpful', 'How many found it helpful, like 1234 or 12.5k (Default: made up)'),
        countOption('funny', 'How many found it funny, like 1234 or 12.5k (Default: made up)'),
        countOption('products', 'How many games the account owns, like 1234 or 1.2k (Default: made up)'),
        ...postEndOptions(['reply-to']),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const shared = postArgs(args);
    return Formatter.Commands.FunSteamreview.createMessage(context, {
      from: shared.from,
      funny: args.funny,
      game: args.game,
      helpful: args.helpful,
      hours: args.hours,
      message: shared.message,
      name: shared.name,
      portrait: shared.portrait,
      products: args.products,
      recommended: args.recommended,
      text: shared.text,
      time: shared.time,
    });
  }
}
