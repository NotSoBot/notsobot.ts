import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'b1';

export default class B1Command extends BaseCommand {
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
            'https://cdn.discordapp.com/attachments/560593452476399626/716571699247579186/b1.png',
        );
    }
}
