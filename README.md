# WhatsApp Business AI Assistant

An intelligent assistant for WhatsApp Business that combines automated responses based on business hours with OpenAI integration to provide a natural and professional chat experience.

## ✨ Features

- 🤖 **Integration with OpenAI**: Natural and contextual responses using GPT
- ⏰ **Business hours management**: Automatic after hours responses
- 📅 **Integration with Airtable**: Holiday detection
- 👥 **Multi-operator support**: Commands from a WhatsApp group.
- ⏱️ **Human response times**: Simulation of read and write times.
- 💬 **Message grouping**: Replies to multiple consecutive messages as a unit.
- 🛠️ **Highly configurable**: Customization of prompts, schedules and behaviors.

## 📋 Prerequisites

- Node.js (v14 or higher)
- A WhatsApp Business account
- OpenAI account with API key
- Optional: An Airtable account for holidays management

## 🚀 Installation

1. Clone this repository:

```bash
git clone https://github.com/judev-jgb/whatsapp-bot-ai.git
cd whatsapp-bot-ai
```

2. Install the dependencies:

```bash
npm install
```

3. Create an `.env` file in the root of the project with the following variables:

```
OPENAI_API_KEY=tu_clave_api_de_openai
AIRTABLE_API_KEY=tu_clave_api_de_airtable
AIRTABLE_BASE_ID=tu_id_de_base_airtable
LOG_LEVEL=INFO
```

4. Customize your company information in `data/companyInfo.js`.

## 💻 Usage

1. Start the wizard:

```bash
npm start
```

2. Scan the QR code that appears on the terminal with your WhatsApp Business.

3. Send a `!status` message in the command group to verify that everything is working correctly.

4. Activate the bot with the `!activate` command.

## 🎮 Available Commands

| Comando                  | Descripción                         |
| ------------------------ | ----------------------------------- |
| `!activate`              | Activate the bot globally           |
| `!pause`                 | Pause the bot globally              |
| `!status`                | Displays system status              |
| `!temp [0-1]`            | Sets AI temperature (creativity)    |
| `!prompt [texto]`        | Update the system prompt            |
| `!reset [número]`        | Resets context of a specific number |
| `!message [texto]`       | Updates out-of-time message         |
| `!schedule [start][end]` | Updates business hours (hours)      |
| `!holidays`              | Updates holiday cache from Airtable |
| `!help`                  | Displays list of available commands |

## 🔧 Configuration

### Business Hours

The default business hours are Monday to Friday from 8:00 to 16:00. You can change it in `config/config.js` or by using the `!schedule` command.

### Holidays

To set up holidays, you need:

1. An Airtable account
2. A base with a table called “Holidays”.
3. A column called “Date” with a date format.

### AI customization

Edit the `data/companyInfo.js` file to customize the responses with information about your company.

## 📝 Advanced Configuration

### Response Times

Set the response times in `config/config.js` in the `DELAY_SETTINGS` section:

```javascript
DELAY_SETTINGS: {
    AUTO_REPLY_DELAY: {
        MIN: 25, // minimum seconds for automatic responses
        MAX: 35  // maximum seconds for automatic responses
    },
    AI_REPLY_DELAY: {
        READING_TIME: {
            MIN: 2,     // minimum seconds of reading
            MAX: 5      // maximum seconds of reading
        },
        TYPING_SPEED: 400,  // Characters per minute
        MIN_DELAY: 4,       // Minimum response seconds
        MAX_ADDITIONAL_DELAY: 6  // Random additional seconds
    },
    MESSAGE_GROUPING: {
        WAIT_TIME: 10  // Waiting seconds for grouping messages
    }
}
```

### Operators

Configure the authorized operators in `config/config.js`:

```javascript
OPERATORS: [
    '34XXXXXXXXX@c.us', // Main number
    '34XXXXXXXXX@c.us'  // Additional operator
],
```

## 🤝 Contribute

Contributions are welcome. Please open an issue to discuss changes you would like to make.

## 📄 License

This project is licensed under [MIT License](LICENSE).

## 🙏 Acknowledgements

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - Library to interact with WhatsApp
- [OpenAI](https://openai.com/) - AI API for natural language processing
- [Airtable](https://airtable.com/) - Platform for data management

> [!WARNING]
> WhatsApp, OpenAI and AirTable are not affiliated with this project. Their use is at your own risk.
