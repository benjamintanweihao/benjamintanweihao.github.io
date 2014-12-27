---
title: "Why My Next Programming Language is Elixir"
date: 2013-06-08 18:21
comments: true
tags: ["Elixir", "Erlang", "Concurrency"]
---

![](/images/elixir-logo.png)

[Elixir](http://elixir-lang.org/) is a functional meta-programming aware language built on top of the [Erlang](http://www.erlang.org/) VM created by José Valim. 

For those who don't know José, he's from Rails core, founder of [Plataformatec](http://plataformatec.com.br/) and author of [Crafting Rails 4 Applications](http://pragprog.com/book/jvrails2/crafting-rails-4-applications).

When I first heard of Elixir, I didn't give much thought to it. During that time, I was trying to wrap my feeble head around [Clojure](http://clojure.org/). Then all of a sudden, I noticed a flurry of activity surrounding this up and coming programming language:

[PeepCode](https://peepcode.com/pages/upcoming) announced that they were filming an episode with José.

[O'reilly](http://oreilly.com/) were going to publish an upcoming book and The Pragmatic Bookshelf had just published [Programming Elixir](http://pragprog.com/book/elixir/programming-elixir) by Dave Thomas. 

Then, there was a blog [post](http://joearms.github.io/2013/05/31/a-week-with-elixir.html) by Joe Armstrong, inventor of Erlang, who wrote about his 1-week experience with Elixir. (He is pretty excited about it.)

##Watching the Alpha Geeks

Tim O'Reilly has been credited for the above phrase through this [talk](http://www.linuxdevcenter.com/pub/a/mac/2002/05/14/oreilly_wwdc_keynote.html). In it, he mentions that a lot of ideas about what books to publish came from observing other hackers and "alpha geeks":

> This is how we get most of our good ideas at O'Reilly. We look for people who appear to be doing magic, and ask them how they do it.  

> There are always people in any field who are the most clued in to the deep trends, who seem to be playing with all the coolest stuff, and seem to have their finger in everything before most people even know about it.

Joe, José and Dave certain qualify as "alpha geeks", and their interest/investment in Elixir is definitely noteworthy.

##Elixir |> The Love-child of Ruby and Erlang |> Accessible Concurrency

Elixir definitely has some Ruby feel to it. Here's some code to whet your appetite:

```elixir
(1..10) |> map(&1*&1) |> filter(fn x -> rem(x, 2) == 0 end)
```

returns `[4,16,36,64,100]`.

The above code illustrates one of the coolest features yet I've seen in a programming language: The `|>` operator. This operator acts very much like the `|` operator in Unix shells.

Briefly, here is what the code does:

1. `(1..10)` specifies a range from 1 to 10. 
2. This range is fed into the `map` function.  
3. `map(&1*&1)` is syntactic sugar for: `map(fn x -> x * x end)`.
4. The result (`[1,4,9,16,25,36,49,64,81,100]`) then is fed yet again into the `filter` function, which only keeps even numbers.

##Learning Concurrency: Not Optional Anymore

Concurrency is getting more and more important - Hence the sudden excitement over learning all these functional programming languages. 

Yes, I could do concurrency in Ruby. There's [Celluloid](https://github.com/celluloid/celluloid) for example. But, concurrency isn't something built into Ruby's DNA. 

While no one raves about Erlang's syntax, there is little doubt that Erlang can handle concurrency remarkably well. With Elixir, we can have the best of both worlds! 

That is yet another reason why I am super excited about Elixir - Having a pretty syntax wrapped around the powerful Erlang VM seems to be an irresistible combination.

##Learning and Writing about Elixir

[![](/images/elixir-book.jpg)](http://pragprog.com/book/elixir/programming-elixir) 

I bought the ebook the moment it was released. So far, I'm enjoying the book very much, and especially looking forward to the part where concurrency is covered. 

I plan to cover aspects of the Elixir language on this blog in the very near future.

Thanks for reading!




