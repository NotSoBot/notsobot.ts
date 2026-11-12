import { Command, CommandClient } from 'detritus-client';

import {
  CommandCategories,
  TagGenerationPersonalityPreferences,
  TagGenerationPersonalityPreferencesToText,
} from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, CommandMetadata } from '../basecommand';


export const COMMAND_NAME = 'ai';

export default class AiCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'debug', type: Boolean},
        {name: 'debug2', aliases: ['d2'], label: 'debugFull', type: Boolean},
        {
          name: 'personalitypreference',
          aliases: ['pp'],
          label: 'personalityPreference',
          type: Parameters.oneOf({choices: TagGenerationPersonalityPreferences, descriptions: TagGenerationPersonalityPreferencesToText}),
        },
        {name: 'url', type: Parameters.url},
        // model picker disabled, the user's `settings set ai model` (or the api default) is used instead
        // {
        //   name: 'use',
        //   label: 'model',
        //   type: Parameters.oneOf({choices: TagGenerationModels, descriptions: TagGenerationModelsToText}),
        // },
      ],
      label: 'prompt',
      metadata: {
        category: CommandCategories.AI,
        pipeable: false,
        description: 'Use NotSoAI to generate and execute TagScript code',
        examples: [
          `${COMMAND_NAME} what is cake\'s user id`,
        ],
        id: Formatter.Commands.TagGenerate.COMMAND_ID,
        usage: '<text> (-debug) (-personalitypreference <choice>) (-url <url>)',
      },
      priority: -1,
      type: Parameters.targetText,
    });
  }

  // replace get commandDescription():

  // no premium check here, the api decides who can use NotSoAI (see the slash `/ai`)
  onBeforeRun(context: Command.Context, args: Formatter.Commands.TagGenerate.CommandArgs) {
    return !!args.prompt;
  }

  async run(context: Command.Context, args: Formatter.Commands.TagGenerate.CommandArgs) {
    return Formatter.Commands.TagGenerate.createMessage(context, args);
  }
}
