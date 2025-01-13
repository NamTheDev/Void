import { Client, Events, GatewayIntentBits } from "discord.js";
import type { Message } from "discord.js";
import Gemini from "gemini-ai";


const { GEMINI_API_KEY, DISCORD_BOT_TOKEN } = Bun.env

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const gemini = new Gemini(GEMINI_API_KEY as string);

client.once(Events.ClientReady, (client: Client<true>) => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const maxViolations = 3;
var violations = 0;

client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    // Delete inappropriate messages

    const response = await gemini.ask(message.content, {
        systemInstruction: "Detect sexual, discrimination, and other offensive topics (exclude unserious and harmless content). Response format:" +
            [
                '**Detection**: `<TRUE or FALSE>`',
                '**Reason**: `<few words>`'
            ].join('\n')
    });

    if (response.toUpperCase().includes("TRUE")) {
        if (violations >= maxViolations) {
            const member = await message.guild?.members.fetch(message.author.id);
            await message.delete();
            return await member?.timeout(60 * 60 * 1000, "Sexual, discrimination, and other offensive topics mentioned in chat.") // 1 hour;
        }
        violations = violations + 1;
        if (message.channel.isSendable())
            message.channel.send(`Hey, <@${message.author.id}>!\n# You just violated a common sense! (${violations}/${maxViolations})\n${violations === maxViolations ? "## 1 hour timeout for next violation." : ""}\n${response}`);
        return await message.delete();
    }
});

client.login(DISCORD_BOT_TOKEN);