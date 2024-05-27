const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.GuildMember],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);

const app = express();
app.use(cors());
const PORT = process.env.BOT_API_PORT || 3001;

app.get('/api/servers', async (req, res) => {
    const servers = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
    }));
    res.json(servers);
});

app.listen(PORT, () => {
    console.log(`Bot API running at http://localhost:${PORT}`);
});
