---
title: "Elixir by Example: The Ring I"
date: 2013-10-09 23:25
comments: true
tags: Elixir, Erlang, Concurrency, Processes
---

I haven't been blogging about Elixir lately, and that's only because I've been overwhelmed.

Coming up with new blog posts has been slightly challenging to say the least. Writing about Elixir's features are great, but I really wanted to get down into the fundamentals: Erlang, OTP and designing Erlang/OTP programs.

I have since bought myself a couple more Erlang books that I can't wait to get my hands on - [Erlang Programming](http://shop.oreilly.com/product/9780596518189.do), [Erlang and OTP in Action](http://www.manning.com/logan/), and [Handbook of Neuroevolution in Erlang](http://www.springer.com/computer/swe/book/978-1-4614-4462-6).

It was Corey Haines' endorsement that compelled me the buy _Handbook of Neuroevolution in Erlang_. (800 pages of awesome, that was how he vaguely put it.)
 
##Introducing, _Elixir By Example_

Learning a new language is best done via experimentation. So I'm starting a new series - Elixir by Example.

A nice touch of _Erlang Programming_ is the end of chapter exercises. Since I'm working on that book now, I will pick the interesting ones that I have attempted (and struggled with!) and share my solutions written in Elixir. 

##And without further ado ...

Here's the problem that we'll be tackling today:

> Write a function which starts N processes in a ring, and sends a message M times 
> around all the processes in the ring. After the messages have been sent the processes
> should terminate gracefully.

And for the more visually-inclined:

![](/images/process_ring.gif)

(Source: [http://www.erlang.org](http://www.erlang.org/course/exercises.html))

Here's the skeleton of the program:

```elixir
defmodule Ring do

  def run(m, n, message) do
    ...
  end

  def start_process do
    ...
  end

  def loop(next_pid) do
    receive do
      ...
    end
  end

end
```

##The Loop

We begin with easy part, the `loop` function:
 
```elixir
  def loop(next_pid) do
    receive do
      {:message, message, 0} -> 
        next_pid <- {:message, message, 0}
        :ok
      {:message, message, m} -> 
        next_pid <- {:message, message, m-1}
        loop(next_pid)
    end
  end
```

There are two kinds of messages we would receive: `m > 0` and `m = 0`. 

In the former case, we will send the same message, with `m` decremented, then call `loop` again so that the process is ready to receive the next message.

In the latter, we will forward the `m == 0` message to the next process, which is our signal for the process to exit.

So how do we know which process to send the message to? An easy option would be to simply pass in the pid of the next message into the `loop` function.


Now that we have settled on our `loop` function, we can start thinking about setting up our process ring.

##The Process Ring

The main difficulty in this problem is setting up the process ring. The approach I chose was for each process to spawn the next. But how do you link the last process back to the first? 

I can think of at least 2 approaches. This post will talk about one of them. I will cover the next approach in a separate post.

Pattern matching is especially suited for thinking through all the cases. We have 3 to consider:

1. First Process
2. Intermediate Processes
3. Last Process

Our problem would be that much easier if we have a way to link back the first process to the last, or vice versa. We cannot store state in Elixir/Erlang, as least not in the traditional sense. But, we definitely can pass state around via _message passing_ and _recursion_. 

The function `start_process` will spawn one process, which would recursively spawn the next, until the `count` is 0. Then, it runs `loop`, so that each of the spawned process can begin handling messages. 

As mentioned previously, there are 3 separate cases to handle.

###1. The First Process

```elixir
  def start_process(count) do
    pid = spawn_link(__MODULE__, :start_process, [count-1,  self])
    loop(pid)
  end
```  

The `start_process/1` function takes the `count`, spawns another process, passing in the decremented `count` and it's own pid. This pid belongs to the last process, and is also how we remember the pid of the last process. 

###2. The Intermediate Processes

The trick here is to realize that we can store the last pid, and use it when we are spawning the last process. For intermediate processes (All processes _except_ the first and last spawned process) we simply pass the pid around using `last` as an argument.

Otherwise, the function looks similar to the previous `start_process/1`.

```elixir
  def start_process(count, last) do
    pid = spawn_link(__MODULE__, :start_process, [count-1, last])
    loop(pid)
  end
```

###3. The Last Process

When `count` is 0, we know that we have spawned our last process. This time, we can finally make use of the pid (stored in `last`) and link the first process to the last.

```elixir
  def start_process(0, last) do
    loop(last)
  end
```  

###Tying it all together

We need a main entry point. `run` takes in all the necessary parameters, and then spawns the first process. By the time `pid = spawn_link(__MODULE__, :start_process, [n-1])` completes, our ring would be set up. 

To get things going, the initial message is then sent to the first process with `pid <- {:message, message, m}`

```elixir
  def run(m, n, message) do
    pid = spawn_link(__MODULE__, :start_process, [n-1])
    pid <- {:message, message, m}
  end
```

###Concluding Remarks

The full source code located [here](https://github.com/benjamintanweihao/erlang_programming_exercises/blob/master/chapter_4/ring_one.ex). I encourage you to play with it, and then try this exercise out for yourself.

This problem proved to be pretty difficult to me, and there a couple of stumbling roadblocks:

####Process Termination 

Making sure all the processes were terminated after `m = 0` took a little thinking and a lot of guesswork. The only reason I noticed this was I fired up `:pman.start`. 

After running the program I noticed that the `loop` processes were lingering around. See if you can replicate this effect by removing just _one_ line in the program):

![](/images/ring_bug.png)

####Ring Setup

I would be the first to admit that figuring this out independently proved too challenging and time consuming. Therefore I had to cheat a little and see how others approached the same problem. 

I personally think you shouldn't feel too bad about this, as long as you learn. (:
 
Thanks for reading!




