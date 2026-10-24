import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MusicEffects, MusicEffectsToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'music effect';

const findEffect = Parameters.oneOf({choices: MusicEffects, descriptions: MusicEffectsToText, error: false});
const findEffectOrError = Parameters.oneOf({choices: MusicEffects, descriptions: MusicEffectsToText});

export default class MusicEffectCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['music effects', 'music fx'],
      disableDm: true,
      label: 'effects',
      metadata: {
        description: 'Put live effects on the music (nightcore, slowed + reverb, 8D and more), up to 3 stacked, on a premium server. Nothing given shows them',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} nightcore`,
          `${COMMAND_NAME} nightcore 8d bassboost`,
          `${COMMAND_NAME} next room, echo`,
          `${COMMAND_NAME} off`,
        ],
        category: CommandCategories.MUSIC,
        id: Formatter.Commands.MusicEffect.COMMAND_ID,
        usage: `?<...${Object.values(MusicEffects).join('|')}>`,
      },
      // commas between them when one's more than a word (`next room, echo`), spaces otherwise. Words that aren't one
      // are skipped, nothing found at all says which there are
      type: (value: string, context: Command.Context): Array<MusicEffects> => {
        const text = value.trim();
        if (!text) {
          return [];
        }
        const effects: Array<MusicEffects> = [];
        for (const part of (text.includes(',')) ? text.split(',') : text.split(/\s+/)) {
          const effect = (part.trim()) ? findEffect(part.trim(), context) : null;
          if (effect && !effects.includes(effect)) {
            effects.push(effect);
          }
        }
        return (effects.length) ? effects : [findEffectOrError(text, context)!];
      },
    });
  }

  async run(context: Command.Context, args: {effects: Array<MusicEffects>}) {
    return Formatter.Commands.MusicEffect.createMessage(context, {effects: args.effects});
  }
}
