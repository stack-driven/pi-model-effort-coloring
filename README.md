# munich-pi

Pi package containing `model-effort-colors`, a footer extension that colors the current model name and thinking/effort level while preserving Pi's built-in footer layout.

## Install

From GitHub:

```bash
pi install git:github.com/<user>/munich-pi
```

From GitLab or another Git URL:

```bash
pi install https://gitlab.com/<user>/munich-pi
```

From a local checkout:

```bash
pi install /absolute/path/to/munich-pi
```

## Reload / restart

After installing, restart Pi. If the package is already loaded in an interactive session, try:

```text
/reload
```

If the footer does not update after `/reload`, quit and start Pi again.

## Security

Pi extensions run as local code with your user permissions. Review extension source before installing packages from Git or any third-party source.
