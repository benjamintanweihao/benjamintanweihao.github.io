---
title: "Installing Erlang 17 the Lazy way on Mac OSX"
date: 2014-03-02 17:29
comments: true
tags: Erlang, Elixir
---

I wanted to experiment with the new features of Erlang 17.0-rc2 this weekend.

Doing a quick search on the Internets yielded quite a few posts which consisted of installing `kerl` and compiling Erlang from source. (Horrible memories of `rvm`, `rbenv` come to mind ...)

While these methods are fine (if it works for you), then go right ahead. I happen to have a puny Macbook Air with only 2GB of RAM. No way I wanted to wait _that_ long. 

There had to be a better way.

## The Lazy Ass (a.k.a. less geeky) way

Here's how I got Erlang 17 on my Mac. (Note: This will _not_ earn you any geek cred with your co-workers. You have been duly warned.)

__Step 1:__ `brew install wxmac`. This might take awhile though.

__Step 2:__ The fine folks at Erlang solutions has got our back. Head over to [here](https://www.erlang-solutions.com/downloads/download-erlang-otp) to download the latest Erlang. 

Here's the [link](http://packages.erlang-solutions.com/site/esl/esl-erlang/FLAVOUR_1_general/esl-erlang_17.0-rc2~osx~10.6.8_i386.dmg) to download the _32 bit_ version.

Why 32 bits? Erlang 17 uses [wxWidgets](https://www.wxwidgets.org) for some GUI stuff, in particular, the [_Observer_](http://www.erlang.org/doc/man/observer_app.html) application. 

Observer basically provides tools for tracing and investigation of distributed systems. In short, a sexier [Appmon](http://www.erlang.org/doc/apps/appmon/appmon_chapter.html).

So please, again, get the __32 bit__ version and save yourself some grief.

__Step 3:__ Once it's all installed, get it a test run:

```
% erl                                                                               
Erlang/OTP 17 [RELEASE CANDIDATE 2] [erts-6.0] [source-a74e66a] [smp:2:2] [async-threads:10] [kernel-poll:false]

Eshell V6.0  (abort with ^G)
1>
```

Go ahead and fire up Observer to make sure nothing went wrong:

```
1> observer:start().
```

Here are a couple of screenshots to whet your appetite:

![](/images/observer_1.png)
![](/images/observer_2.png)
![](/images/observer_3.png)

## For Elixirists/Elixirians/Elixirystas

With Erlang 17, you can go ahead and play with Elixir v0.13. Josh Adams has made two __free__ videos on maps at [Elixir Sips](http://elixirsips.com/episodes.html) – definitely check that out.

Also, go subscribe! There's some really good stuff in there. (No, I'm not getting anything out of this. I'm simply a fan and subscriber.)

Thanks for reading, and hopefully I helped you saved same some time.
