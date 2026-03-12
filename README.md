![GymRats app icon small](./icon-small.png)

# RatBot [![GitHub tag](https://img.shields.io/github/tag/epeters95/gymbot)](https://github.com/epeters95/gymbot/tags)

Tracks GymRats group notifications and sends them to a Discord channel.

## Setup

The node server is hard-configured to listen to notifications via Waydroid in the following pipeline:

- GymRats notification -> Waydroid -> IFTTT -> Telegram App -> **RatBot** -> Discord

To connect the inbound/outbound services, the following variables must be set in `.env`:

    API_TOKEN=<telegram token>
    API_ID=<telegram app id>
    API_HASH=<telegram app hash>
    DISCORD_TOKEN=<discord app token>
    DISCORD_CLIENT_ID=<bot application id>

Set ids for the server and channel to receive announcements in `config.json`:

    {
        "guildId": <discord server id>,
        "channelId": <discord channel id>
    }

Telegram must be configured with a user app to receive the notifications. Messages are expected to arrive in the following format:

    {
        "appname": "GymRats",
        "title": <notification title>,
        "message": <notification message>,
        "received": "March 9, 2026 at 12:09AM"
    }



### Commands

`/gymrat <display name>`
- will associate a user's discord handle with their GymRats display name

### Configuration

By default, only weekly or monthly announcements are sent to the channel. To send individual posts, set env variable `TEST_MODE = true` and restart the node server.

### Deployment

Install Node.js 22.12 via [nvm](https://github.com/nvm-sh/nvm), then run:

    npm install
    node deploy-commands.js
    node .

Note: `deploy-commands.js` must be run after any changes to commands.



## Built With

  - [Raspberry Pi 500+](https://www.raspberrypi.com/products/raspberry-pi-500-plus)
  - [Claude Code](https://www.anthropic.com/claude) - Used
    for improvements
  - [OpenAI Codex](https://openai.com/codex/) - Used for improvements

## Contributing

You can submit ideas and feature requests to the fitness channel or send a message to @EP.

## TODO's

- [ ] /leaderboard command
- [ ] Handle discord channel fetch error (uncommon)
- [ ] Import history to gymrats.json

## License

This project is licensed under the [GNU General Public License v3](LICENSE.md)
