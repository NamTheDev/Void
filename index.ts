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

client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) return;

    const serverRules = [
        "No swearing",
        "No NSFW content",
        "No advertising",
        "No discrimination",
        "Only friendly, general and daily topics are allowed"
    ]

    const response = await gemini.ask(message.content, {
        systemInstruction: `
        You are a Discord moderator.
        You can warn people.
        Put everything null if no violation is found.
        Server rules: ${serverRules.join(", ")}.
        Your response must trigger a specific Discord.js v14 method.
        Allowed methods:
        - message.channel.send
        - message.delete
        `,
        safetySettings: {
            hate: Gemini.SafetyThreshold.BLOCK_NONE,
            sexual: Gemini.SafetyThreshold.BLOCK_NONE,
            harassment: Gemini.SafetyThreshold.BLOCK_NONE,
            dangerous: Gemini.SafetyThreshold.BLOCK_NONE

        }
    });

    const formattedResponse = response.replace('javascript', '').split('```')[1];
    eval(formattedResponse);
});

client.login(DISCORD_BOT_TOKEN);