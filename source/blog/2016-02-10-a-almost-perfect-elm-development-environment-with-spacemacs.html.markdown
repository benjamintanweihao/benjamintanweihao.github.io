---
title: A (almost) perfect Elm development environment with Spacemacs
date: 2016-02-10 16:31 UTC
tags: elm, spacemacs, emacs
---

![](http://i.imgur.com/dfNhBNN.png)

I have recently been messing around with Elm, especially since it seems to tie in beautifully with the Phoenix web framework. Also, anything to get away from JavaScript.

Whenever I am learning a new language, I always want to get my development environment set up nicely. For Elm in particular, I had a few requirements that were important to me:

1. Proper syntax highlighting, formatting and indentation;
2. Documentation + Type Signatures;
3. Catch errors as I type and present them nicely, just like a Real IDE™;
4. REPL, package installation, previewing in a browser and other bells and whistles.

Since I needed to excuse to play with Spacemacs, coupled with most other editors proved to be pretty inadequate, Spacemacs it was. (Again, I needed an excuse).

It was surprising that getting the Elm-lang layer to function the way I wanted took a bit more work than expected. This post serves to document what I did, _in the hopes that someone will tell me that I got something hopelessly wrong and say "Here, this is the way to do it"_.

## The End Result

<iframe width="420" height="315" src="https://www.youtube.com/embed/raEwHv53XSA" frameborder="0" allowfullscreen></iframe>

If you don't care about any explanations and want to see if it works for you, here's the link to the [`.spacemacs`](https://gist.github.com/benjamintanweihao/55a8b2e91dba66c50d8e) file.

## The Important Bits

```lisp
(defun dotspacemacs/layers ()
  (setq-default
   dotspacemacs-configuration-layers
   '(
     (auto-completion :variables
                      auto-completion-enable-help-tooltip t
                      auto-completion-enable-snippets-in-popup t)
     ...
     (syntax-checking :variables
                      syntax-checking-enable-tooltips nil)
    )
    ...
    elm
    ...
  )
)
```

Here, we add extra configuration to `auto-completion` so that documentation and snippets appear. Note: I am assuming you have read the elm-layer [README](https://github.com/syl20bnr/spacemacs/tree/master/layers/%2Blang/elm).

In `syntax-checking`, we disable tooltips because it will obscure the view of the documentation tooltip with the error message tooltip.

Finally, I found that I had to manually add `company-elm` to the list of `company-backends`:

```lisp
(defun dotspacemacs/user-config ()
  "Configuration function for user code.
This function is called at the very end of Spacemacs initialization after
layers configuration. You are free to put any user code."
  (with-eval-after-load 'company
    (add-to-list 'company-backends 'company-elm))
)
```

## A Sample Workflow

Here's what you get once you have set up everything nicely:

<iframe width="420" height="315" src="https://www.youtube.com/embed/xwboPogg35k" frameborder="0" allowfullscreen></iframe>

A couple of features you might notice:

* Syntax highlighting and Indentation
* Auto-completion with documentation that includes type signatures
* Installing of Elm packages within Spacemacs
* Importing of Elm packages within Spacemacs

## Why the "almost"?

I have found that the auto-completion isn't as reliable I would like it to be. 

Sometimes `Array.` shows me the full list of completions. However there are quite a few occasions where I have to help it out a little and do `Array.i` for it to show me `Array.isEmpty` and `Array.initialize`. 

Part of the reason seems to stem from the limitations for the current implementation of `elm-oracle`, which the README prompts you to install.

From what I understand, that's because it needs to fetch the documentation from the internet each time a completion needs to be performed. Also, the queries don't seem to be cached.

You can find out more [here](https://github.com/ElmCast/elm-oracle/issues/13).

The Elm layer already goes a pretty long way to streamline the development process. So while it isn't exactly IDE-grade yet, it is pretty damn close. 

And since Elm is a fantastic language from what I see so far, I think it is worth the wait.  
