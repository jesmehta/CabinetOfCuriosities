# Creating this site

This site came about at a funky point in time for me, in a lot of ways.

Tech-wise, I have had to get a new laptop since the previous one died, and that means I need to setup all my coding IDEs and other such all over again. I used to use Atom, which is being archived, so I am finally switching over to VSCode. VSCode, I am sure, is very full-featured; but it can get a little complicated until you get used to it, so I had avoided it for the past few years.

Anyway, here's the list of things - notes for me - to do whenever I need to setup a new machine

## New Environments

- [Install Python](https://www.python.org/downloads/)  
 Make sure to check off adding it to the Environment Variables

- [Install Git](https://git-scm.com/downloads)  

- [Install VSCode](https://code.visualstudio.com/download)

- VSCode Extensions
    - Live Server (Ritwick Dey)  
        For serving pages, especially my p5/javascript work  
    - Prettier (Prettier)  
        Code syntax prettification, not sure what exactly it is doing, but it has been only 2 hours so far
    - File Utils (Steffen Leistner)  
        More than the default options on copying, duplicating, path copy, etc
    - Duplicate Action (mrmlnc)  
        Specifically duplicating files
    - Github pull requests (Github)  
        Manage GitHub syncs, but this I haven't managed to get to work, so it's back to my previous workflow using GitHub Desktop  
    - Add keybindings to the duplicate file command to get yourself a keyboard shortcut as well, since this was a command I used frequently in Atom.  

- Install MKDocs, the [Material theme](https://squidfunk.github.io/mkdocs-material/getting-started/), etc  
    - `pip install mkdocs`
    - `pip install mkdocs-material `
    - `pip install mkdocs-video`
    - `pip install markdown-captions`

    Use `pip list` to see installed packages and add whatever is missing.  
    Use `pip list -> requirements.txt` to generate the requirments.txt file of all currently installed packages 

- [Install GitHub Desktop](https://desktop.github.com/download/)

## Workflows

I have not been able to get VSCode to work with GitHub (not that I tried too hard) but I do find my previous workflow convenient, and it provides a good separation, if an airgap is what one needs between the working files and the deployed files. If you are looking for seamless integration, feel free to make it work. I find it safer to work on the files offline, test them using `mkdocs serve`, and only then sync them to github pages to be deployed.  

### GitLab pages

GitLab workflow from Fab times
- MKDocs, GitGui, GitLab
- Work on the MD files offline in working copy, Folder A
- Preview and check this using `mkdocs serve`
- Use WinMerge to overwrite and sync working folder with synced Folder B
- Sync using GitGUI (while I am a fan of CLI for certain things, I prefer my GIT with a GUI)
- The GitLab pipeline then deploys the MD pages to a static HTML site

Thus, there are 3 copies of the webpages at any given time.  
1. Working copy - folder A  
2. Synced clean copy - folder B  
3. Online copy - deployed on Gitlab and rendered as HTML  

I developed this slightly elongated workflow in the early days of doing the FabAcademy course since I was frequently messing up the files, uploads, YMLs, etc floundering about on my own, and I wanted a rather absolute degree of separation that did not involve messing around with version control. Yes, the irony of manual versions and separate editions WHILE using a version control system has not gone unnoticed, but honestly, I am using GitLab/GitHub as much or more to serve a website as to manage versioning.

This is all the more useful when you screw up the GitLab uploads and things get stuck between the online and the offline. This may happen due to errors in the pipeline or yml files, or simply that upload sizes exceed the 10 MB fabAcademy limit. Instead of reversing the push and messing around in there, it is far simpler, atleast for a newbie, to   
    - clone a new copy pulled down from the web version, (folder B.2, for eg)  
    - repeat WinMerge to update it with the latest changes, (folder A -> folder B.2)  
    - manage the issue that had happened, and   
    - push this to the repo for deployment (B.2 -> Gitlab)  

B.1, the original clean version whose push threw the error, gets abandoned and evetually deleted.  
This works very well for sites and pages that aren't too large and can be quickly downloaded.

The same process can be followed if you have had to use the Web IDE to edit files for any reason and now your web version is ahead of the desktop version, or that you have two separate sets of changes, one in the web version and one in the desktop. WinMerge to the rescue.

I am sure git,  github, and gitlab have several relevant tools to update, merge and sync different commits across branches, and I would love to get deeper into this, but at the moment, this is quick and dirty but very effective, especially with the right apps in your workflow.

### GitHub pages

The above workflow works, so I wanted to replicate it with GitHub for this set of pages.
I had mucked around trying to figure GitHub actions and suchlike at some point last year. But things weren't quite working. 

I found templates on the Materials for MKDocs pages as well, but they were repo templates, and would still need some sort of actions.

Most basic searches and readings told me to use `mkdocs build` and push or `mkdocs deploy`, but those will only push static HTML that is already rendered by MKDocs, not the MD files. 

I found some reference to generating a `gh-pages` branch which would contain the html and a main branch to contain the MD, but no info on Actions or Pipelines that was easily understandable.

I then had a long-winded conversation with ChatGPT. I explained my GitLab workflow, uploaded my gitlab-ci.yml and requirements.txt files, and got an explanation of how that setup worked, and what was the closest option in GitHub, etc.

To cut a long story short,  
and you can find the conversation [here](https://chatgpt.com/share/676e7582-c400-8004-b849-48bf3045e69c)  

- GitHub does not have the exact same process as GitLabs. In GitLabs, you see only the MD and none of the HTML files in the repo. However, in GitHub, you will see both. As I had seen earlier, there will be a `main` branch and a `gh-pages` branch, and one can be edited using MKDocs while the other is deployed to github pages.
- However, you can, infact specify Actions to generate HTML pages whenever the MD pages are updated
- GPT also gave me the deploy.yml and requirements.txt files to add to the repo

This is what the repo should look like
```
my-mkdocs-site/
├── docs/
│   ├── index.md
│   ├── about.md
│   └── guide.md
├── mkdocs.yml
├── requirements.txt
└── .github/
    └── workflows/
        └── deploy.yml
```

After doing all of this, and also making sure the offline version served correctly using `mkdocs serve`, I pushed the new repo.
Ofcourse it threw an error.

No `gh-pages` branch was generated to be able to be deployed as the source branch of the GitHub page. The Action page showed where the error was. More conversation with ChatGPT later, the solution :

```
- Go to Settings > Actions > General in your repository.
- Under Workflow permissions, ensure Read and write permissions are enabled.
- Save the changes and re-run the workflow.
```

This worked ! The Action ran successfully.

From the GitHub pages' `Settings > Pages`, I selected the gh-pages as the branch to deploy, and voila, the site appeared on the interwebs.  
After some cloning down, edits, and pushing back up, changes did trigger the action and the page got updated. 

It finally worked.  

It's been a day. Phew.  

---

Had this not worked, I still had some plans up my sleeve.

Any existing public repo that used MKDocs to create pages could be cloned and stripped of the content but keeping the structure and actions (like what I did initially for the GitLab workflow.) All that would remain would be to find such sites.

Option 1 : I was already part of the [Make4Animals repo](https://github.com/make4animals/make4animals.github.io/), and Salman Faris had very graciously created the site for Nanditha and the rest of the group to use as the primary M4A website. Cloning that was next on my agenda if nothing else worked.

Option 2 : I did a quick google search : `site: github.io "Made with Material for MkDocs"` to turn up results that I could use to get to a working repo to clone. [This one](https://vra.github.io/mkdocs-material-example/) was a promising barebones page to work with.

I might just put up a barebones clone of this repo as well, to start off new pages in the future, and help anyone else stuck like me.

I again suspect that, if the correct learning and process is followed, there is very likely an existing action to choose from on GitHub that can be directly applied to your repo. A solution so obvious that there isn't any reason to document a manual process to achive the same result. However, I have this now. Maybe in the upcomin months, I'll check with some Fab alums to figure it out.

---

Other resources and things to look into later :  
[Material - Creating your site](https://squidfunk.github.io/mkdocs-material/creating-your-site/)  
[Material - Social Cards](https://squidfunk.github.io/mkdocs-material/setup/setting-up-social-cards/)  
[Material - Blog](https://squidfunk.github.io/mkdocs-material/setup/setting-up-a-blog/)  

---

Files  
[deploy.yml](files/deploy.yml.txt)  
[requirements.txt](files/requirements.txt)  

---
