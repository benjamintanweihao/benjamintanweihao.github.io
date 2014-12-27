---
title: "How to Optimize Unicorn Workers in a Ruby on Rails App"
date: 2013-10-26 20:45
comments: true
tags: ["Unicorn", "Rails", "Ruby"]
---

## Introducing Unicorn

![Credits: Github](http://i.imgur.com/IPAGGvx.png)

If you are a Rails developer, you would probably have heard of [Unicorn](http://unicorn.bogomips.org/), a HTTP server that can handle multiple requests concurrently.

Unicorn uses forked processes to achieve concurrency. Since forked processes are essentially copies of each other, this means that the Rails application need not be thread safe.

This is great because it is difficult to ensure that _our_ own code is thread safe. If we cannot ensure that our code is thread safe, then concurrent web servers such as [Puma](http://www.puma.io) and even alternative Ruby implementations that exploit concurrency and parallelism such as [JRuby](http://jruby.org/) and [Rubinius](http://rubini.us/) would be out of the question.

Therefore, Unicorn gives our Rails apps concurrency even when they are not thread safe. However, this comes at a cost. Rails apps running on Unicorn tend to consume much more memory. Without paying any heed to the memory consumption of your app, you may well find yourself with an overburdened server. 

In this article, we will explore a few ways how we can exploit Unicorn's concurrency while at the same time control the memory consumption.

Read the [rest](https://www.digitalocean.com/community/articles/how-to-optimize-unicorn-workers-in-a-ruby-on-rails-app) of the article.
