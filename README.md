# RatBot

Tracks GymRats group notifications and sends them to a Discord channel.

## Setup

The server is hard-configured to listen to notifications via Waydroid in the following pipeline:

- GymRats notification -> Waydroid -> IFTTT -> Telegram App -> **RatBot** -> Discord

To connect the inbound/outbound services, the following variables must be set in `.env`:

    #.env
    API_TOKEN=<telegram token>
    API_ID=<telegram app id>
    API_HASH=<telegram app hash>
    DISCORD_TOKEN=<discord app token>
    CHANNEL_ID=<discord server channel id>

### Commands

`/gymrat <display name>`
- will associate a user's discord handle with their GymRats display name

### Configuration

By default, only weekly or monthly announcements are sent to the channel. To send individual posts, set `TEST_MODE = true` and restart the server.

### Deployment

Node 22.12

## Built With

  - [Raspberry Pi 500+](https://www.raspberrypi.com › products › raspberry-pi-500-plus)
  - [Claude Code](https://www.anthropic.com/claude) - Used
    for improvements
  - [OpenAI Codex](https://openai.com/codex/) - Used for improvements

## Contributing

You can submit ideas and feature requests to the fitness channel, or send a message to @EP.

## License

This project is licensed under the [GNU General Public License v3](LICENSE.md)


