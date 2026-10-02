# Cineminha

**A YouTube player for small kids that only plays the videos you approved.**

[Português](README.pt-BR.md)

Cineminha ("little cinema" in Portuguese) is a small app for your phone or tablet. Your child sees big thumbnails of the videos you picked, and nothing else: no search, no recommendations, no "up next".

- **Only your list.** Videos are added by the parents, from a page protected by a PIN.
- **No related videos.** When a video pauses or ends, the app covers YouTube's suggestions with its own screen.
- **One video at a time, to the end.** There is no seek bar, and the back button does nothing until the video ends.
- **Music and cartoons.** The home screen has two big buttons. Each category shows 3 highlights and a button to see the rest.
- **Both parents can add videos** from any phone or computer, and the video shows up right away.
- **Ready-made packs** to start with: songs and cartoons from official channels, in Portuguese, English and Italian.
- **Portuguese or English** for the whole app.

It runs on your own free [Vercel](https://vercel.com) account. Your list is yours: nobody else sees it, and there is no company in the middle.

## Set it up (about 15 minutes)

You need an email address. No programming.

1. **Create a free GitHub account** at [github.com/signup](https://github.com/signup). GitHub keeps your copy of the app's code.
2. **Click this button:**

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbruberries%2Fcineminha&project-name=cineminha&repository-name=cineminha&env=PARENT_PIN&envDescription=The+parents%27+PIN%3A+numbers+only%2C+at+least+6+digits.+You%27ll+type+it+to+add+videos.&envLink=https%3A%2F%2Fgithub.com%2Fbruberries%2Fcineminha%23parents-pin&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%7D%5D)

   - Sign in to Vercel with your GitHub account (choose the free **Hobby** plan if asked).
   - Keep the suggested repository name and click **Create**.
   - When Vercel asks for a database, pick **Upstash for Redis**, the **Free** plan, and accept. This is where your video list is stored.
   - <a id="parents-pin"></a>When it asks for **PARENT_PIN**, type the parents' PIN: numbers only, at least 6 digits. Write it down; you'll need it to add videos.
   - Click **Deploy** and wait about a minute.
3. **Open your app.** Vercel shows the address, something like `cineminha-yourname.vercel.app`. Add `/parents` to the end (for example `cineminha-yourname.vercel.app/parents`), type the PIN, and choose:
   - the language,
   - the app's name (it shows on the screen and on the phone icon),
   - which ready-made packs to start with, if any.
4. **Install it on your child's device.**
   - **Android:** open the address in Chrome, tap **⋮ → Add to Home screen → Install**.
   - **iPhone/iPad:** open it in Safari, tap **Share → Add to Home Screen**.
5. **Lock the device to the app** so your child can't leave it.
   - **Android:** turn on *Settings → Security → App pinning* (the name changes a little between brands), then pin the app from the recent apps screen.
   - **iPhone/iPad:** turn on *Settings → Accessibility → Guided Access*, open the app and triple-click the side button.

Didn't get the database question in step 2? After the deploy, open your project on Vercel, go to **Storage → Create Database → Upstash for Redis → Free**, connect it to the project, then **Deployments → ⋯ → Redeploy**.

## Everyday use

**Add a video:** open `your-address/parents`, paste a YouTube link, pick a category, tap **Add**. Share the address and the PIN with the other parent so they can add videos too.

**From inside the app:** hold the app's name at the top for 3 seconds and answer a multiplication question. It opens the parents' area.

**Leave a video before it ends:** hold the top-left corner of the screen for 3 seconds.

**Highlights:** the first 3 videos of each category are the ones on the home screen. In the parents' area, use **Make highlight**, ↑ and ↓ to choose them.

## Good to know

- **Ads.** If a video has ads, YouTube may still show one before it starts.
- **Some videos can't be added.** When the owner blocked playing outside YouTube, the parents' area says so.
- **YouTube's rules.** Cineminha uses YouTube's own embedded player and covers parts of it to hide suggestions. That's fine for a family app, but YouTube's terms don't allow covering the player in products for the public, so please don't turn this into a public service.
- **Cost.** The free plans of Vercel and Upstash are far more than one family needs.
- **Privacy.** The app stores only your list of videos and the names you type in "Your name". It has no accounts, analytics or tracking.
- **Change the PIN.** On Vercel: your project → **Settings → Environment Variables → PARENT_PIN → Edit**, then redeploy.
- **10 wrong PINs** in an hour lock the parents' area on that network for an hour.

## Ready-made packs

| Pack | Videos | Type | Language | Source |
| --- | --- | --- | --- | --- |
| Tiquequê | 150 | Music | Portuguese | Tiquequê |
| Pé de Sonho | 95 | Music | Portuguese | Pé de Sonho |
| Palavra Cantada | 411 | Music | Portuguese | Palavra Cantada Oficial |
| Sesame Street songs | 5 | Music | English | Sesame Street |
| Backyardigans (Brazilian Portuguese) | 80 | Cartoons | Portuguese | Treehouse Direct Brasil |
| Backyardigans | 80 | Cartoons | English | The Backyardigans - Official |
| Curious George | 774 | Cartoons | English | Curious George Official |
| Curious George (Italian) | 497 | Cartoons | Italian | Curioso come George |

Each pack has only single songs or episodes (no hour-long compilations), and every video was checked to play outside YouTube. Want to suggest a pack? Open an issue with the channel.

## For developers

Plain HTML, CSS and JavaScript, no build step. The API is two Vercel functions.

| File | What it does |
| --- | --- |
| `index.html` | The kids' app: chooser, categories, the player that hides suggestions |
| `parents.html` | Parents' area: first-time setup, videos, categories, packs, settings |
| `api/data.js` | Reads and changes the one Redis document that holds everything |
| `api/manifest.js` | Install manifest named after the app |
| `i18n.js` | All text in Portuguese and English |
| `packs/` | Ready-made packs (`index.json` lists them) |
| `dev/server.js` | Local preview with an in-memory database |

```sh
PARENT_PIN=1234 npm run dev   # http://localhost:3000, no Vercel account needed
npm test                      # end-to-end check of the API
```

To add a language, copy the `en` blocks in `i18n.js` and add the code to `LANGS`.

## License

MIT. Made by a mom who wanted her toddler to watch the songs she picked, all the way to the end.
