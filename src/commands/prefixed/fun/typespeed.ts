import { Command, CommandClient } from 'detritus-client';

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
                description: 'Measure how fast you type',
                examples: [
                    COMMAND_NAME,
                    `${COMMAND_NAME} -dates`,
                    `${COMMAND_NAME} -words`
                ],
                id: Formatter.Commands.FunTypeSpeed.COMMAND_ID,
                usage: '(-dates)',
                aliases: ['speedtype']
            },
        });
    }

    run(context: Command.Context, args: Formatter.Commands.FunTypeSpeed.CommandArgs) {
        return Formatter.Commands.FunTypeSpeed.createMessage(context, args);
    }
}