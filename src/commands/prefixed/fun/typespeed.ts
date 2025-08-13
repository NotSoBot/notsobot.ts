import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { editOrReply, Formatter } from '../../../utils';

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
                    `${COMMAND_NAME} -words`,
                ],
                id: Formatter.Commands.FunTypeSpeed.COMMAND_ID,
                usage: '(-dates) (-words)',
                aliases: ['speedtype', 'typerace'],
                permissionsClient: [Permissions.READ_MESSAGE_HISTORY],
                args: [
                    { name: 'dates', aliases: ['t'], type: Boolean },
                    { name: 'words', aliases: ['w'], type: Boolean }
                ]
            },
        });
    }

    onBeforeRun(context: Command.Context, args: Formatter.Commands.FunTypeSpeed.CommandArgs) {
        if (args.dates && args.words) {
            return false;
        }

        return true;
    }

    onCancelRun(context: Command.Context, args: Formatter.Commands.FunTypeSpeed.CommandArgs) {
        if (args.dates && args.words) {
            return editOrReply(context, '⚠ Cannot mix in both words and dates');
        }

        return super.onCancelRun(context, args)
    }

    async run(context: Command.Context, args: Formatter.Commands.FunTypeSpeed.CommandArgs) {
        return Formatter.Commands.FunTypeSpeed.createMessage(context, args);
    }
}