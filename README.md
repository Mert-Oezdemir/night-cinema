# Night Cinema

Open `index.html` in a current browser. The sample catalogue works offline. The local runtime connects live TMDB search using your account token.

- Explore six fictional films with CSS poster art.
- Search titles and stories, filter by genre or view the watchlist.
- Save and remove films. The watchlist persists when browser storage is available.

Night Cinema is an independent implementation of the general film-catalogue idea. Its code, poster artwork, titles and summaries were created for this project. [Project that inspired the topic](https://github.com/YildizDikme/TMDB-API-Project).

## Local server and agent connection

Install Node 22 or newer and Git. From this repository run:

```sh
npm ci
npm start
```

Open the loopback URL printed by the command. The runtime is pinned to a specific revision of [Project Agent Bridge](https://github.com/Mert-Oezdemir/project-agent-bridge).

To connect an MCP-compatible agent, run `npm run mcp:config --silent` and add its `mcpServers` entry to your host. Run `npm run doctor` to see local project and account configuration.

Chrome or Edge is needed for agent browser controls. You can set `CHROME` in `.env`, or run `npx playwright install chromium` to install a browser.

Copy `.env.example` to `.env` before adding account settings. Keep `.env` local. Restart the runtime after changing it.

Set `TMDB_API_TOKEN` to your TMDB API Read Access Token. Select Live TMDB for popular films, search and page navigation. Saved live films persist across reloads. Genre filtering applies to the sample catalogue.
