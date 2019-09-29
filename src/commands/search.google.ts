import { Command, Constants, Utils } from 'detritus-client';

const { Colors } = Constants;

import { searchGoogle } from '../api';
import { LOCALES } from '../constants';
import { onRunError, onTypeError } from '../utils';


export default (<Command.CommandOptions> {
  name: 'google',
  aliases: ['g'],
  args: [
    {name: 'safe', type: 'bool'},
    {
      name: 'language',
      aliases: ['locale'],
      type: (value, context) => {
        value = value.trim();
        if (!value) {
          if (context.guild) {
            value = context.guild.preferredLocale.toLowerCase();
          } else {
            value = 'en-us';
          }
        }
        if (!LOCALES.includes(value)) {
          throw new Error(`Must be one of ${LOCALES.map((locale) => `\`${locale}\``).join(', ')}`);
        }
        return value;
      },
    }
  ],
  label: 'query',
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.reply('⚠ Unable to embed in this channel.'),
  onBeforeRun: (context, args) => !!args.query,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of question.'),
  run: async (context, args) => {
    await context.triggerTyping();

    const { cards, results } = await searchGoogle(context, args);
    if (results.length) {
      const embed = new Utils.Embed();
      embed.setColor(Colors.BLURPLE);

      for (const result of results.slice(0, 3)) {
        const description: Array<string> = [
          `[**${result.cite}**](${result.url})`,
          result.description.replace('*', '\*'),
        ];
        if (result.suggestions.length) {
          description.push([
            `**Suggestions**:`,
            result.suggestions.map((suggestion: any) => {
              return `[${suggestion.text}](${suggestion.url})`;
            }).join(', '),
          ].join(' '));
        }

        embed.addField(`**${result.title}**`, description.join('\n'));
      }

      return context.editOrReply({embed});
    }
  },
  onRunError,
  onTypeError,
});
