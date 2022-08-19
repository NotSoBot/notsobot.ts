import { Command, CommandClient } from 'detritus-client';

<<<<<<< Updated upstream
import { CDN } from '../../../api/endpoints';
import { CommandCategories } from '../../../constants';
import { editOrReply } from '../../../utils';
=======
import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';
>>>>>>> Stashed changes

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'b1';

export default class B1Command extends BaseCommand {
<<<<<<< Updated upstream
    constructor(client: CommandClient) {
        super(client, {
            name: COMMAND_NAME,

            metadata: {
                description: 'cool',
                examples: [
                    COMMAND_NAME,
                ],
                category: CommandCategories.FUN,
                usage: '',
            },
        });
    }

    async run(context: Command.Context) {
        return editOrReply(
            context,
            CDN.COMMAND_ASSETS_B1,
        );
    }
=======
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.FUN,
        description: 'cool',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.FunB1.COMMAND_ID,
        usage: '',
      },
    });
  }

  run(context: Command.Context, args: Formatter.Commands.FunB1.CommandArgs) {
    return Formatter.Commands.FunB1.createMessage(context, args);
  }
>>>>>>> Stashed changes
}
