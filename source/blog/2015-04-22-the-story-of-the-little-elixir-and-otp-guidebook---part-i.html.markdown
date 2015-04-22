---
title: The Story of The Little Elixir and OTP Guidebook - Part I
date: 2015-04-22 14:58 UTC
tags: Writing, Elixir, Book
---

Unlike most of my posts, this one is going to be a retrospective of the writing process of [The Little Elixir and OTP Guidebook](http://www.manning.com/tanweihao?a_aid=exotpbook&a_bid=99f537ec). I especially enjoy reading about behind-the-scenes stories like the one I am about to tell you. Hopefully, you are no different. 

## It started with stickers. 

I am a sucker for stickers. One fine day, a certain [Dave Thomas](https://twitter.com/pragdave) was asking on Twitter who wanted Elixir stickers. I am someone who would ever miss up on something _free_, obviously wanted a _gajillion_ stickers. Didn't matter where I was going to stick them.

![Stickers OMG!](http://i.imgur.com/0kIMYFX.png)

Ok fine, so I just asked for _three_. _Two_ whole days passed (two days is too long to wait for stickers) and Dave finally replied:

![Dave Thomas is awesome](http://i.imgur.com/HV8Polg.png)

Holy crap! Dave Thomas – Mr. Pragmatic Programmer – read my blog post! I hope I wasn't interpreting it the wrong way, but he seemed to suggest that I was somewhat capable of writing a book. Ha!

## Blogging, blogging.

I kept blogging. Initially, I wrote about design patterns. After an abysmal three posts, I decided to abandon the effort and focused on Elixir. I couldn't get enough of it. I could see the excitement and community gradually swell. Sure, it was hard work, but it as _addictive_ too, more so when people are enjoying what you write.

## Cover design, Title, Domain Name

Dave might have never thought twice about the email he sent, but somehow that nagging message kept prodding at the back of my head.

One fine day, I gave in. Since Elixir was fairly unknown then, I decided to create a sales page. By then I was hell bent on writing a book, any book, on Elixir. But I also wanted to make sure I wasn't going to waste my precious youth (ha-ha). 

You know how some developers have trouble starting a project if they didn't had a good name? I had the writer's equivalent. First, I had to decide on a cover. I headed over to the [Noun Project](http://thenounproject.com/) and picked me a nice logo. For the background, I went for [Subtle Patterns](http://subtlepatterns.com/). I designed everything in ... wait for it ... PowerPoint.

Next, I had to figure out a good title. I knew it had to contain "Elixir" and "OTP". I started to research titles. I came across [A Little Riak Book](littleriakbook.com) and [Riak Handbook](Riak Handbook). A little bit here, a little bit there, and I settled on a title. Having "Little" was great too, because it explicitly told people _not_ to expect that much content.

Domain name came next. Here were some of the ones I came up with: 

* `thelittleelixirandotpguidebook.com` (Too long, duh)
* `elixirotpguidebook.com` (I kept noticing "rot")

I decided that `www.exotpbook.com` made for a good compromise. With all that out of the way, I had enough material to make me a landing page. [LaunchRock](https://www.launchrock.com/) was perfect for this. 

## Did people even bother? Well, yes!

As soon as I launched the page and announced it to the world (maybe 10 people were listening), I nervously kept refreshing the page every 5 minutes or so, just to see if there were any new sign ups. Thankfully, by the end of the week, I had around 100+ signups. Looks like it's a go! 

## Publisher and Publishing

I settled for [Softcover](https://www.softcover.io/), a service created by Michael Hartl, of Rails Tutorial fame. I especially enjoyed the toolchain. I could write the manuscript Markdown, and it spat out EPUB, MOBI and PDF. I really didn't think about payments then. I was obsessing more about the tools used to write the book. Not only did Softcover provide the toolchain, it had a marketing page and other bells and whistles which made it a very pleasant platform to write on.

![Softcover](http://i.imgur.com/tWr1WpX.png)

I briefly considered LeanPub, but dismissed it because I thought its fonts were too damn ugly. I have a LeanPub book [here](https://leanpub.com/therubyclosuresbook).

## The Plan

I thought up the Table of Contents, was pleased with it, and proceeded to begin writing on the 23rd of February, 2014. Along the way, I set up MailChimp for sign ups and newsletters. 

And so it began:

```
% git log | tail                                                
commit b2ef2ac7d730d11066e9d81615e5f070ebbf43e0
Author: Benjamin Tan Wei Hao <benjamintanweihao@gmail.com>
Date:   Sun Feb 23 10:54:17 2014 +0800

    Initial commit.
```

## I needed help ...

Along the way, I knew I needed reviewers. I reached out to the Elixir community, and also to other developers via the [mailing list](http://us3.campaign-archive2.com/?u=e6c489d8ae654374bfa191d29&id=4ee1177637). I wasn't placing much hope in it, but it was worth a try.

## ... and help came pouring! 

The response was _incredible_. Developers from all over reached out. Some even sent me their _résumés_. I was absolutely floored and humbled. In the end, I had to [turn down many requests](https://us3.admin.mailchimp.com/campaigns/show?id=725449). 

As the months went by, I received numerous other emails from developers wanting to volunteer their time. Once again, I thank each and every one of you who wrote to me.

I went on to set up a Trello board for the reviewers:

![Trello](http://i.imgur.com/8PR5XIO.png)

The reviewers and I started on the 1st of May 2014. The plan was to release June/July 2014, just in time for the inaugural ElixirConf. That was the plan until Manning contacted me.

## Ohai, Manning! 

On the 6th of June, 2014, I received an email from Michael Stephens, the Associate Publisher from Manning:

> Mike Stephens with Manning Publications here. I’ve seen your page for The Little Elixir and OTP Guidebook and it looks like it’s going to be  a wonderful addition to the books announced on Elixir.

I was totally freaking out and dancing around by then.

> I’m wondering whether you’d be interested in the possibility of publishing with Manning rather than self publishing.

Oh hell yes. 

So far, the people at Manning have been super friendly. My only gripe is the constant back and forth, though I think most of it is unavoidable. This is in part that writing a book is tough, and also made tougher when we operate on different timezones. One nine day I will write about the entire Manning experience.

## Ohai, The Little Elixir/OTP Guidebook!

The totally amount of effort needed to put together a book, even though it contains 3 chapters, is daunting to say the least. While I did all the writing, it was extremely heartening to have the community donate their time and energy into making the book better, from its earliest stages to its current iteration.

I'm super stoked that I can finally get the book into the hands of readers. There's just the small thing of writing the _rest_ of the chapters. 

Besides the fantastically smart people behind Elixir and all the wonderful Elixir libraries, I don't think there's really an Elixir _expert_. At least I'm far from being one. I just like to about write things that other smart people make.

## How's the book doing?

So far it's selling pretty well! I expect it to surpass 300 by the end of the week. Thanks for all the support – My wife and I thank you!

![](http://www.manning.com/tanweihao/tanweihao_cover150.jpg)

If you haven't bought the book yet, [here you go](http://www.manning.com/tanweihao?a_aid=exotpbook&a_bid=99f537ec). Ping me at `@bentanweihao` on Twitter if would like a coupon code too!
