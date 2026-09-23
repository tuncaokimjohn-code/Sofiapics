# Sofia Birthday Vault

A temporary, mobile-first birthday microsite with a relationship timeline, proposal video, funny photo archive, custom mini-game, secret vault, microphone candle interaction, and finale.

## Run locally

No build step is required.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Locked dates

- Sofia's birthday: **September 27, 2026**
- Age: **27**
- Relationship anniversary: **July 08**
- First-message date used for the unlock clue: **June 10, 2023**

## Default passcode

The current passcode is `0610`, based on the June 10 first-message date.

Change it in `config.js`:

```js
passcode: "0610"
```

This is a client-side surprise gate, not real security. Keep the GitHub repository private if the assets are personal.

## Birthday letter

The final birthday letter is already included in `config.js` and displayed inside the Secret Vault.


## Add the voice message

1. Put the recording in `assets/audio/`, for example `assets/audio/kim-message.m4a`.
2. Set this in `config.js`:

```js
voiceFile: "assets/audio/kim-message.m4a"
```

## Deploy with GitHub + Vercel

1. Create a **private** GitHub repository.
2. Push this folder to the repository.
3. Import the repository into Vercel.
4. Framework preset: `Other` or static site. No build command is needed.
5. Deploy.
6. After the birthday, remove the Vercel deployment or disconnect the production domain. The GitHub repository can remain private as an archive.

## Notes

- The microphone candle feature uses the browser Web Audio API.
- If microphone permission is denied, the user can hold the fallback button to blow out the candles.
- The mini-game intentionally lets Sofia survive the first four Kim obstacles. The final wall is scripted to be unavoidable and opens the secret vault.
- The proposal video was compressed for web delivery while preserving its audio.
