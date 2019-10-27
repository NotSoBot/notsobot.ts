import { Command } from 'detritus-client';

import { CommandTypes } from '../../constants';
import { onRunError } from '../../utils';


export default (<Command.CommandOptions> {
  name: 'tts',
  aliases: ['text-to-speech'],
  args: [{name: 'use'}],
  metadata: {
    description: 'Text to Speech',
    examples: [
      'tts i love cake',
      'tts i love cake -use spanish',
    ],
    type: CommandTypes.FUN,
    usage: 'tts <text> (-use <language/type>)',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  run: async (context) => context.reply('maybe some day'),
  onRunError,
});
