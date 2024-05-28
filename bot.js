const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./database'); // Import the database connection

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    partials: [Partials.GuildMember],
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    try {
        const servers = client.guilds.cache.map(guild => guild.id);
        for (const serverId of servers) {
            await pool.query('INSERT INTO server_settings (server_id, prefix) VALUES (?, ?) ON DUPLICATE KEY UPDATE prefix = prefix', [serverId, '!']);
        }
        console.log('Default prefixes set for all servers.');
    } catch (error) {
        console.error('Error setting default prefixes:', error);
    }
});

client.on('guildCreate', async (guild) => {
    try {
        await pool.query('INSERT INTO server_settings (server_id, prefix) VALUES (?, ?) ON DUPLICATE KEY UPDATE prefix = prefix', [guild.id, '!']);
        console.log(`Default prefix set for new server: ${guild.id}`);
    } catch (error) {
        console.error('Error setting default prefix for new server:', error);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

const app = express();
app.use(cors());
app.use(express.json()); // To parse JSON bodies
const PORT = process.env.BOT_API_PORT || 3001;

app.get('/api/servers', async (req, res) => {
    try {
        const servers = client.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL(),
        }));
        console.log('Fetched servers:', servers);
        res.json(servers);
    } catch (error) {
        console.error('Error fetching servers:', error);
        res.status(500).send('Error fetching servers');
    }
});

app.get('/api/server/:id/prefix', async (req, res) => {
    const serverId = req.params.id;
    console.log(`Fetching prefix for server ${serverId}`);
    try {
        const [rows] = await pool.query('SELECT prefix FROM server_settings WHERE server_id = ?', [serverId]);
        if (rows.length > 0) {
            console.log(`Found prefix for server ${serverId}: ${rows[0].prefix}`);
            res.json({ prefix: rows[0].prefix });
        } else {
            console.log(`No prefix found for server ${serverId}, setting default '!'`);
            await pool.query('INSERT INTO server_settings (server_id, prefix) VALUES (?, ?)', [serverId, '!']);
            res.json({ prefix: '!' }); // Default prefix if not set
        }
    } catch (error) {
        console.error('Error fetching prefix:', error);
        res.status(500).send('Error fetching prefix');
    }
});

app.post('/api/server/:id/prefix', async (req, res) => {
    const serverId = req.params.id;
    const { prefix } = req.body;
    console.log(`Setting prefix for server ${serverId} to ${prefix}`);
    try {
        await pool.query('INSERT INTO server_settings (server_id, prefix) VALUES (?, ?) ON DUPLICATE KEY UPDATE prefix = ?', [serverId, prefix, prefix]);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error setting prefix:', error);
        res.status(500).send('Error setting prefix');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bot API running at ${process.env.BOT_API_URL}`);
});
