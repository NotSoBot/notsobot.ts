import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { googleSearch } from '../api';
import {
  CommandTypes,
  EmbedBrands,
  EmbedColors,
  GoogleCardTypes,
  GoogleLocalesText,
  GOOGLE_CARD_TYPES_SUPPORTED,
} from '../constants';
import { Arguments, Paginator, onRunError, onTypeError } from '../utils';


const RESULTS_PER_PAGE = 3;

export interface CommandArgs {
  locale: string,
  query: string,
  safe: boolean,
}

export default (<Command.CommandOptions> {
  name: 'reversesearch',
  aliases: ['imgs'],
  args: [Arguments.GoogleLocale, Arguments.Safe],
  label: 'query',
  metadata: {
    description: 'Search Google',
    examples: [
      'google notsobot',
      'google notsobot -locale russian',
      'google something nsfw -safe',
    ],
    type: CommandTypes.SEARCH,
    usage: 'google <query> (-locale <language>) (-safe)',
  },
  ratelimits: [
    {
      duration: 5000,
      limit: 5,
      type: 'guild',
    },
    {
      duration: 1000,
      limit: 1,
      type: 'channel',
    },
  ],
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.editOrReply('⚠ Unable to embed in this channel.'),
  onBeforeRun: (context, args) => !!args.query,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();
    return context.editOrReply('yeet');
  },
  onRunError,
  onTypeError,
});
