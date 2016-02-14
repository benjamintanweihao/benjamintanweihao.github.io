---
title: A (almost) perfect Elm development environment with Spacemacs
date: 2016-02-10 16:31 UTC
tags: elm, spacemacs, emacs
---

I am messing around with Elm now, especially since it seems to tie in beautifully with the Phoenix web framework. Also, anything to get away from JavaScript.

Whenever I am learning a new language, I always want to get my development environment set up nicely. For Elm in particular, I had a few requirements that were important to me:

1. Proper syntax highlighting and formatting
2. Documentation + Type Signatures
3. Catch errors as I type, just like a "Real IDE™"
4. REPL, package installation, previewing in a browser and other bells and whistles

Since I needed to excuse to play with Spacemacs, and since the rest of the editors proved to be pretty inadequate, Spacemacs it was.

It was surprising that getting the Elm-lang layer to function the way I wanted took a bit more work than expected. This post serves to document what I did, in the hopes that someone will tell me that I got something hopelessly wrong and say "Here, this is the way to do it".

## The end result

Here's want I (almost) want:


If you don't care about any explanations and want to see if it works for you, here's the link to the `.spacemacs` file.

## Caveats

### Save when you want auto-complete


## Why the "almost"?

The tooltips are butt-ugly. I've been told that this follows the windowing system but I have no idea how to configure that on OSX.




