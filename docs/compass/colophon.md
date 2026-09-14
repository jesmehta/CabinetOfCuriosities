# Colophon

The first version of this site came about during the Christmas of 2024.  l
The current version came  into being over the summer of 2026.

I had had a site live at jesalmehta.com since about 2018. However, I did not create it, I had a friend develop it for me professionally. I knew that gathering the material for the site itself would be a full-fledged task, so developing it alongside would take me an-age-and-a-half before the first cut itself. Paying someone to do it was money absolutely well spent.

In 2023, I completed my Diploma of the FabAcademy program, and as part of the documentation, I had all my work and the project on a GitLab site, made using MKDocs.

MKDocs gave a huge boost to my accessibilty to create webpages. I was already using Github pages to toss things out on the open web, but between the intense documentation and the easy accessibility of MKDocs, I was now far more confident of buiding myself a fun web sandbox.

Late 2024, I got myself a new laptop, and had to setup my systems all over again. Atom had been archived and I had also moved to VSCode as editor of choice. So, one fine evening during the Christmas break, on the 27th of December, I created the new repo and added an MKDocs project into it. The Cabinet was now open.

That first version can be seen archived here - [v1 - the original MkDocs site](../../archived-landing-pages/v1/)

The first version grew in spurts. When Twitter shutdown the bot API, my Tracery Bots were homeless. At some point in May, during the summer break, I migrated them to Tracery x p5.js projects and then put them up on webpages. August 2025, I was headed to Fab25 in Czechia, and I had seen Walter work with a mini FabLoom during the Fab23 workshops. I had built my own and used it with some Kutchi weaving techniques, and was eager to show that to Walter. So I put up the Loom page, hoping that I was going to bump into Walter or others from the Lima lab who could pass my appreciation along to Walter. In September 2025, I was doing a couple of workshops for CCFest, and I needed a webpage to host resources and instructions, which eventually became the Circle Packing Library.  

With the coming of AI, I had jumped on the bandwagon. I had initially used ChatGPT, probably 3.5 or so, to structure the Tracery Bots generator pages. I continued to use ChatGPT at work. However, the pages were lying fairly stagnant since Sep 2025.  

Work was keeping me occupied, and along with doing the Fabricademy diploma program on the side, my plate was full, and then some. As the Fabricademy program wound down and the summer break of 2026 arrived, I was playing around with Claude as well, alongwith ChatGPT.

I attended Dr Kurush Dalal and the GyanFactory's 5 day workshop on Science Fiction sometime in mid-May. Day 2 was a session on the Golden Age of Scifi, and I took down a crazy amount of notes, and decided I needed to make it all into a coherent reading list. One thing led to another, and before I realised what had happened, I had used the tools at my disposal to assemble the list, gather more data on the authors and books mentioned, and turned it into a timeline. Then the timeline turned into other visualisations, and the page turned into a set of tabs with a fairly comprehensive reading list, filters and groups, magazine data, and so on.

This needed a home, and needed to be shared. All at once, I had an idea for a triptych of pages. The Cabinet of Curiosities, which while it already existed, would certainly need to be revamped. In a similar vein, The Bookshelf of Curiosities, where the SciFi would find a home, with dreams of more writings and visualisations on comics, other authors, and all things orbiting my love of reading would find a home. And finally, Form follows f(x) - a name I had initially created as a hashtag on instagram for my generative art and creative coding. I had always though it was a particulary clever play, intersecting the Design adage, "Form follows Function" with f(x), a function of math which is central to my generative art.

I dumped the whole vision into ChatGPT, and brainstormed with it on the structure and content bifurcation, and so much more. One good advice that came out of this was to start with the simplest first, and work out the kinks in that, before moving onto the next higher complexity. This was very useful, and I started with the least complex (and most AI) page - The Bookshelf. After ironing out the content and structural kinks in it, I moved onto FFFX. I brought over all the learnings and design decisions from the Bookshelf, but with the added complexity of a generative landing page that created it's layout on the spot when it is loaded. Once that was done, I spent some time adding and moving entries from the old Cabinet to the two new worlds I had built.

I spent some time playing with the two existing worlds, bringing them upto shape. I had decided to give them custom landing pages while keeping the mkdocs backends.

For the Bookshelf, I initially embedded the html within the index.md, while for Fffx, I began with and independent index.html. Bookshelf went through several look and feel iterations before coming back to the base that Claude had initially proposed and I had discarded. I then reworked it carefully and made it the version seen today.

Given my learnings from the Bookshelf, I created Fffx with a very strong specification, algorithm and steps defined, and outcome very specific. It worked out with very few issues and I spend more time fine-tuning the details.

As I was migrating old content, adding new stuff, linking to standalone repos that weren't anchored to any place online apart from their own index pages, I learnt a lot about managing data and webpage development.

Finally, as the summer break started, I decided to tackle the Cabinet redesign itself.

I had always wanted a Medieval map look, but it had been a struggle to get Claude to create a map that looked good. I was used to generating noise based topology, and I threw everything I had it, specifying outcomes, specifying steps, cajoling it, being curt, to no avail.

What finally worked was an absolute step by step method which I worked out, and did not reveal to the AI all at once.

Working on a noise field directly wasn't working. I started off with slicing off sections, then seeding each section with the required number of starting points. Then those points were grown into packed circles using my circle packing algorithm. Once the circles were established, multipliers were applied on the noise field for every circle, based also on its radius. Curl noise was used instead of Perlin to avoid river currents and keep up divergence everywhere. A threshhold was established to isolate the islands vs the sea, and subsequent noise bands were offset from that threshold to get more topological details. A constant offset was used to create the map colour bands.

After a few weeks of trials on the colours, effects, fonts, effects, and so on, and a huge effort on colour themes, I had finally settled on two. Since I couldn't decide on one, I used both - one as a base theme, and one as a hover effect. 

I trialled the effects by having toggles on a control panel, and eventually the configuration is copied off the panel into a file the system reads. A chunk of work also went into having the dynamic island system that was processing heavy and then a workflow for converting it into a static svg shape system that would load easily for the end user.

Finally, as all good art, I never finished the scene, I abandoned it. At some point, I decided things were enough, and moved on to adding back more content.

Came back to Fffx and Bookshelf, and 


In the meantime, earlier versions of this site are archived and still browsable:

- [v1 -- the original MkDocs site](../../archived-landing-pages/v1/)
- [v2 -- the archipelago-map stub that briefly replaced it](../../archived-landing-pages/v2/)
    - [01 -- initial](../../archived-landing-pages/v2-history/01-initial/)
    - [02 -- Round 1 visual pass](../../archived-landing-pages/v2-history/02-round1-visual-pass/)
    - [03 -- coastline regen](../../archived-landing-pages/v2-history/03-coastline-regen/)
    - [04 -- serpent redesign](../../archived-landing-pages/v2-history/04-serpent-redesign/)
- [Archipelago Algorithm Bench -- the Perlin-noise/radial-gradient/threshold island-generation prototype explored during the v2 review, before v3's own warp/angular-noise + circle-packing approach](../../archived-landing-pages/algorithm-bench/)
- [v3, pre-split -- the island-shape tuning page just before `islands-tool.html` was carved out as its own permanent copy](../../archived-landing-pages/v3-history/01-pre-islands-tool-split/)
