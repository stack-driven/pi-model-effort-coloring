# pi-model-effort-coloring

<img width="479" height="138" alt="Pi model effort coloring preview" src="https://raw.githubusercontent.com/stack-driven/pi-model-effort-coloring/main/assets/pi-model-effort-coloring-preview.png" />

Pi extension that colors the current model name and thinking/effort level in Pi’s footer without changing the footer layout.

## Installation

From npm (recommended):

```bash
pi install npm:pi-model-effort-coloring
```

From GitHub:

```bash
pi install git:github.com/stack-driven/pi-model-effort-coloring
```

From a local checkout:

```bash
pi install /absolute/path/to/pi-model-effort-coloring
```

Then restart your Pi session. If the package is already loaded in an interactive session, try:

```text
/reload
```

If the footer does not update after `/reload`, quit and start Pi again.

## Extension

`model-effort-colors` adds color accents to:

- current model/provider name
- thinking/effort level: `minimal`, `low`, `medium`, `high`, `xhigh`

Color map:

- **Model/provider accent**: Anthropic/Claude `#DD7B5F`, OpenAI `#10A37F`, Gemini/Google `#4285F4`, Groq `#F55036`, Mistral `#FF7000`, DeepSeek `#4D6BFE`, Llama/Meta `#0866FF`, OpenRouter `#8B5CF6`, GitLab Duo `#FC6D26`.
- **Thinking/effort accent**: `minimal` gray, `low` yellow, `medium` green, `high` lavender, `xhigh` pulsing purple.

## Security

Pi extensions run as local code with your user permissions. Review extension source before installing packages from Git or any third-party source.

## License

MIT
