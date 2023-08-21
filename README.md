# obit-bot

A nifty little bot to scrape funerary ads from a newspaper and turn it into an RSS file served by Github Pages.

## Los que ya no compran en Harrod's, Gath & Chaves.

This phrase is a usual catchphrase from my mom. She's an aging person and usually reads the sunday newspaper from top to bottom. On the last page, it usually contains funerary ads, like obituaries, but much smaller. La Nacion, the newspaper she buys, usually has these, in short versions, and is the only new paper that has them online.

The phrase she usually coins, on the title of this subsection, is for those she checks on, gone from this earth, and is a big metaphorical phrase, since Harrod's, and Gath & Chaves are big department stores that have closed by the beginning of the 20th Century.

For her to use this phrase, is to say that these that appear here are the ones that won't shop there no more. A fitting tribute.

## But why? 

Unlike her, I don't buy the newspaper in physical version, and getting mentions from her like "Have you seen who passed away?" without reading it can become cumbersome. Also, to do this by having to visit the page every time. As I'm lazy, or busy, whichever you prefer, I deviced this little script that, along with a github action, will render the funerary page, which is updated only once a day, during the early morning, and will serve,  through Github Pages, an RSS file that I can check daily, without having to save history or go back to the page each day each time.

## How does it work?

It is a simple script generated in Node, which through Cheerio and Axios, will fetch the page, convert the ad formats into items in our RSS, generate said file and serve it to us through Github Pages, updating through Github Actions only once a day. I will leave this up for a good while, but feel free to reuse or serve it yourself if you feel like it. 

### How to set it up locally

Fork this repo and clone it on your system:

`git clone https://github.com/gusma/obit-bot`

Navigate into the repo and install the dependencies:

```
cd github-bot
npm install
```

Run this locally:

`node obit-scraper.js`

To see how it works.

### How to set up this same repo:

However, if you wish to replicate this repo you can fork it or clone it, but mind you for it to work, you will need to:

A. Set up Github Pages in your repo.
B. Set up Environment Variables (Github Secrets) inside your repo's settings for the Yaml file to work. The two variables to be modified are `COMMITTER_NAME` (with your Github Name), and `COMMITTER_EMAIL` (your Github username email) for the yaml that runs the github action to work.

Good luck!