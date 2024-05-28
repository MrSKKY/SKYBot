const express = require('express');
const session = require('express-session');
const axios = require('axios');
const dotenv = require('dotenv');
const pool = require('./database'); // Adjust the path if necessary

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const PORT = process.env.PORT;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const BOT_API_URL = process.env.BOT_API_URL;
const BOT_PERMISSIONS = process.env.BOT_PERMISSIONS;

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
}));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
    const authorizeUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify guilds`;
    console.log(`Redirecting to: ${authorizeUrl}`);
    res.redirect(authorizeUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        console.error("No code received in the callback");
        return res.send('No code provided');
    }

    try {
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            scope: 'identify guilds',
        });

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        console.log('Fetched user guilds:', guildsResponse.data); // Debugging line

        req.session.user = userResponse.data;
        req.session.guilds = guildsResponse.data;
        req.session.access_token = access_token;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error during authentication:', error);
        res.send('An error occurred during authentication');
    }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    res.sendFile(__dirname + '/public/dashboard.html');
});

app.get('/api/servers', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        console.log('Session guilds:', req.session.guilds); // Debugging line
        const userGuilds = req.session.guilds.filter(guild => {
            return guild.owner || (guild.permissions & 0x8) === 0x8; // Check if the user is the owner or has ADMINISTRATOR permission
        });

        const botServersResponse = await axios.get(`${BOT_API_URL}/api/servers`);
        const botServers = botServersResponse.data;

        console.log('Bot servers:', botServers); // Debugging line

        const enrichedGuilds = userGuilds.map(guild => {
            guild.isBotInServer = botServers.some(botGuild => botGuild.id === guild.id); // Add a flag to indicate if the bot is in the server
            return guild;
        });

        console.log('Enriched guilds:', enrichedGuilds); // Debugging line

        res.json(enrichedGuilds);
    } catch (error) {
        console.error('Error fetching servers:', error);
        res.status(500).send('An error occurred while fetching servers.');
    }
});

app.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    res.json(req.session.user);
});

app.post('/save-settings', async (req, res) => {
    const { server_id, prefix, welcome_message } = req.body;

    try {
        await pool.query(
            `INSERT INTO server_settings (server_id, prefix, welcome_message) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE prefix=VALUES(prefix), welcome_message=VALUES(welcome_message)`,
            [server_id, prefix, welcome_message]
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error saving settings:', err);
        res.send('An error occurred while saving settings.');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/server/:id', (req, res) => {
    // Handle the server-specific settings here
    res.send(`Settings for server ID: ${req.params.id}`);
});

app.listen(PORT, () => {
    console.log(`Web panel running at http://localhost:${PORT}`);
});
