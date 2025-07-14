import { Command, Interaction } from 'detritus-client';
import { Components } from 'detritus-client/lib/utils';

import { compareTwoStrings } from 'string-similarity';

import { utilitiesImagescriptV1 } from '../../../api';
import { editOrReply } from '../..';


export const COMMAND_ID = 'fun.typerace';


export interface CommandArgs {

}


export async function createMessage(
    context: Command.Context | Interaction.InteractionContext,
    args: CommandArgs,
) {
    const q: Response = await fetch('https://dummyjson.com/quotes/random');
    const text: string = (await q.json()).quote;

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
    const resp = await utilitiesImagescriptV1(context, { code });
    const filename: string = resp.file.filename;
    let data: Buffer | string = (
        (resp.file.value)
        ? Buffer.from(resp.file.value, 'base64')
        : Buffer.alloc(0)
    );

    const components = new Components();
    const container = components.createContainer();
    container.addTextDisplay({ content: 'Type the text below as fast as you can!' });
    container.addSeparator();
    container.createMediaGallery()
        .addItem({ media: { url: `attachment://${filename}` } });

    const initial = await editOrReply(context, {
        file: { filename: filename, value: data },
        components: components
    });

    const start = Date.now();
    const sub = context.client.subscribe('messageCreate', async (msg) => {
        const message = msg.message;
        if (message.author.id !== context.user.id) return;
        if (message.channelId !== context.channelId) return;

        clearTimeout(timeout);
        sub.remove();

        const end: number = (Date.now() - start) / 1000;
        const percent: number = compareTwoStrings(message.content, text) * 100;
        const words: number = message.content.trim().split(/\s+/).length;
        const wpm: number = (words * 60) / end;
        
        await message.reply({
            content: `${percent.toFixed(1)}%, ${wpm.toFixed(1)} wpm, in ${end.toFixed(2)} seconds`,
            messageReference: { messageId: message.id }
        });
    });

    const timeout = setTimeout(async () => {
        sub.remove();
        return await initial?.reply({
            content: 'Timed out waiting for a message.',
            messageReference: { messageId: initial.id }
        });
    }, 45000);
}