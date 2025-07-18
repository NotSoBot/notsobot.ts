import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'typespeed';


export default class TypeSpeed extends BaseCommand {
    constructor (client: CommandClient) {
        super(client, {
            name: COMMAND_NAME,
            metadata: {
                category: CommandCategories.FUN,
                description: 'See who can type the fastest and accurately in 60 seconds',
                examples: [
                    COMMAND_NAME,
                    `${COMMAND_NAME} -dates`,
                ],
                id: Formatter.Commands.FunTypeSpeed.COMMAND_ID,
                usage: '(-dates)',
                aliases: ['speedtype', 'typerace'],
                permissionsClient: [Permissions.READ_MESSAGE_HISTORY]
            },
        });
    }

    async run(context: Command.Context, args: Formatter.Commands.FunTypeSpeed.CommandArgs) {
        return Formatter.Commands.FunTypeSpeed.createMessage(context, args);
    }
}