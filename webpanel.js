const express = require('express');
const session = require('express-session');
const axios = require('axios');
const dotenv = require('dotenv');

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
    res.redirect(authorizeUrl);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
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

        req.session.user = userResponse.data;
        req.session.guilds = guildsResponse.data;
        req.session.access_token = access_token;

        res.redirect('/dashboard');
    } catch (error) {
        res.send('An error occurred during authentication');
    }
});

app.get('/invite-callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).json({ success: false, error: 'No code provided' });
    }

    try {
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            scope: 'bot applications.commands',
        });

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token } = tokenResponse.data;

        // Further actions with the token if needed
        // For now, just send a success response
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'An error occurred during bot invitation' });
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
        const userGuilds = req.session.guilds.filter(guild => {
            return guild.owner || (guild.permissions & 0x8) === 0x8; // Check if the user is the owner or has ADMINISTRATOR permission
        });

        const botServersResponse = await axios.get(`${BOT_API_URL}/api/servers`);
        const botServers = botServersResponse.data;

        const enrichedGuilds = userGuilds.map(guild => {
            guild.isBotInServer = botServers.some(botGuild => botGuild.id === guild.id); // Add a flag to indicate if the bot is in the server
            return guild;
        });

        res.json(enrichedGuilds);
    } catch (error) {
        res.status(500).send('An error occurred while fetching servers.');
    }
});

app.get('/api/user', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized');
    }

    res.json(req.session.user);
});

app.get('/dashboard/:serverId', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }

    const serverId = req.params.serverId;
    const guild = req.session.guilds.find(guild => guild.id === serverId);

    if (!guild) {
        return res.status(404).send('Not found or not authorized!');
    }

    res.sendFile(__dirname + '/public/config.html');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`Web panel running at http://localhost:${PORT}`);
});
