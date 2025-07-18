import { Command } from 'detritus-client';
import { Components } from 'detritus-client/lib/utils';
import { Timers } from 'detritus-utils';

import { compareTwoStrings } from 'string-similarity';
import { randomInt } from 'mathjs';

import { utilitiesImagescriptV1 } from '../../../api';
import { editOrReply } from '../..';
import { BooleanEmojis } from '../../../constants';


export const COMMAND_ID = 'fun.typespeed';


export interface CommandArgs {
    dates?: boolean,
}


interface Winner {
    accuracy: string,
    time: string,
    wpm: string,
}


export async function createMessage(
    context: Command.Context,
    args: CommandArgs,
) {
    let text: string;
    if (args.dates) {
        text = dates();
    } else {
        const response = await fetch('https://dummyjson.com/quotes/random');
        text = (await response.json()).quote;
    }

    // didn't see a text-to-image endpoint anywhere,
    // so i'm using mscript instead
    const code: string = `
        create bg 1024 512 0 0 0
        text text 50 1000 #FFFFFF ${text}
        contain text 1024 512
        if texth > 512 resize bg bgh 768
        overlay bg text
        render bg
    `;
    
    const image = await utilitiesImagescriptV1(context, { code });
    const filename: string = image.file.filename;
    let data: Buffer | string = (
        (image.file.value)
        ? Buffer.from(image.file.value, 'base64')
        : Buffer.alloc(0)
    );

    const initial = await editOrReply(context, 'Race will begin in 5 seconds...');
    await Timers.sleep(5000);
    await initial.edit({
        file: { filename: filename, value: data },
        content: `Type the text below as fast and accurately as you can`,
        allowedMentions: { repliedUser: false }
    });

    const start = Date.now();
    const winners: Record<string, Winner> = {};

    const sub = context.client.subscribe('messageCreate', async (msg) => {
        const message = msg.message;
        
        if (message.author.bot) return;
        if (message.author.id in winners) return;
        if (message.channelId !== context.channelId) return;

        const time: number = (Date.now() - start) / 1000;
        const accuracy: number = compareTwoStrings(message.content, text) * 100;
        const words: number = message.content.trim().split(/\s+/).length;
        const wpm: number = (words * 60) / time;
        winners[message.author.id] = {
            accuracy: accuracy.toFixed(1),
            time: time.toFixed(2),
            wpm: wpm.toFixed(1)
        };

        if (message.canReact) await message.react(BooleanEmojis.YES);
    });

    const timeout = setTimeout(async () => {
        sub.remove();
        const options = {
            messageReference: { messageId: initial.id },
            allowedMentions: { repliedUser: false }
        };

        if (Object.keys(winners).length === 0) {
            return await initial.reply({
                content: `${BooleanEmojis.WARNING} Didn't get a message from anyone`,
                ...options
            });
        }

        const content: string[] = [];
        for (const [id, stats] of Object.entries(winners)) {
            content.push(`<@${id}>: ${stats.accuracy}% accuracy, ${stats.wpm} wpm, in ${stats.time}s`);
        }

        await initial.reply({
            content: content.join('\n'),
            ...options
        })
    }, 60000);
}


function dates(): string {
    const amount: number = randomInt(10, 15);
    const dates: string[] = [];

    for (let i = 0; i < amount; i++) {
        const time = new Date(+new Date() - Math.floor(Math.random() * 10000000000));
        const mm = String(time.getMonth() + 1).padStart(2, '0');
        const dd = String(time.getDate()).padStart(2, '0');
        const yyyy = time.getFullYear();
        
        dates.push(`${mm}/${dd}/${yyyy}`);
    }

    return dates.join(', ');
}