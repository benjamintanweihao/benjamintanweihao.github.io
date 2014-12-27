---
title: "Beginner Elixir Project Ideas"
date: 2014-05-20 11:51
comments: true
tags: Elixir, Erlang, Ideas
---

So you have been studying and playing with Elixir for quite a while, and you are pretty well-versed with the basics. There comes a point in time when you start to ask:

> What projects can I work on to learn more about Elixir?

I have asked others on the Elixir Talk Google group a similar question. The [responses](https://groups.google.com/forum/#!searchin/elixir-lang-talk/projects/elixir-lang-talk/xwEgtkOi9kQ/iUQ4bTTyMQ8J) are great, and well worth a look. I guess the main reason for this is a lot of developers (including yours truly) coming to Elixir have little experience programming concurrent, not to mention, distributed applications. Therefore, they have little experience to draw on.

So what's a beginner Elixir developer to do?

## Step 0: Do the Chat example

_Everybody_ will start with "Do the chat example". So do it, then move along to Step 1.

## Step 1: Learn to convert Erlang to Elixir

The first thing to do is learn how to convert Erlang code to Elixir. For this, the [official docs](http://elixir-lang.org/crash-course.html) is very useful. Along the way, you might even start to appreciate Elixir even more. This is important because learning how to read Erlang code opens up the _entire_ ecosystem. Believe me, it is not hard, 80% of the time. The rest of the 20%, there's always the Google group, IRC and Stack Overflow.

## Step 2: Read Erlang books

Get you hands on as many Erlang books as you can. Here's a list:

* [Learn You Some Erlang for Great Good](http://learnyousomeerlang.com/)
* [Erlang Programming](http://shop.oreilly.com/product/9780596518189.do)
* [Erlang and OTP in Action](http://www.manning.com/logan/)

All these books have nice example programs/exercises that can be ported over to Elixir with some effort. Even better, you can also convert the examples and exercises and put them up on a git repository to help other beginners. The last book in the list for example, walks you through building a reliable, distributed, key-value store.

## Step 3: Port existing Erlang programs

There's a wealth of interesting Erlang programs out there. I'm not saying you should port [Riak](https://github.com/basho/riak), but something like [Poolboy](https://github.com/devinus/poolboy) (self described as a _hunky pool factory_) or even a redis client such as [eredis](https://github.com/wooga/eredis).

## Step 4: Keep having a Beginner's mind

![](/images/begmind.jpg)

> If your mind is empty, it is always ready for anything, it is open to everything. In the beginner's mind there are many possibilities, but in the expert's mind there are few.
> 
> ― Shunryu Suzuki

Being a beginner is a precious state to be in. Celebrate and treasure it, because it is far to easy to slip into complacency.

Thanks for reading!

