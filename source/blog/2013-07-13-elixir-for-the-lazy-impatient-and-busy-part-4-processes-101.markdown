---
title: "Elixir for the Lazy Impatient and Busy: Part 4 Processes 103"
date: 2013-07-13 12:24
comments: true
tags: ['Elixir', 'Processes']
---

A big welcome to Part 4 of Elixir for the Lazy, Impatient and Busy - Processes 103! 

If you're new, do look at the previous posts on [Lists](/blog/2013/06/13/elixir-for-the-lazy-impatient-and-busy-lists-and-recursion/) and Processes ([Part 1](/blog/2013/06/25/elixir-for-the-lazy-impatient-and-busy-part-2-processes-101/) and [Part 2](/blog/2013/07/04/elixir-for-the-lazy-impatient-and-busy-part-3-processes-101/)).

Today, we'll look at the finer points of message passing. What happens when messages that are sent to a process cannot be processed?

##Ready your terminals!

This will lead us to a fun exercise, where we purposely write code to get ourselves stuck, then unstuck, along with sneak peek into Elixir's distributed capabilities - all at the same time!

##What happens to unreceived messages?

We all know what happens to received messages - the matching clause is executed.

But what about unreceived messages? Let's find out:

```elixir
iex> self <- "i'm so lonely"
"i'm so lonely"
iex> self <- "so very lonely"
"so very lonely"
iex> self <- "i have nobody"
"i have nobody"
```

By default, the message is always returned after it has been sent. It doesn't matter if the the process you are sending to can handle the message or not. 

Observe:

```elixir
iex(1)> self <- "some message"
"some message"
iex(2)> self <- (1..10)
1..10
iex(3)> self <- {:one, :two, :three}
{:one,:two,:three}
```

(Thanks to Yurii Rashkovskii for pointing this out!)

Now, lets see what is queued in the __mailbox__ of the process using `flush/0`:

```elixir
iex> flush
"i'm so lonely"
"so very lonely"
"i have nobody"
:ok
```

Let's try to `flush/0` again:

```elixir
iex> flush
:ok
```

Once flushed, all the queued messages are gone.

Obviously, this is pretty useless behavior. But the lesson here is unhandled messages are stored in a mailbox.

To handle these messages, our process needs to know how to receive it. 

Let's send some messages that our process doesn't know how to handle (yet):

```elixir
iex> self <- "i'm so lonely"
"i'm so lonely"
iex> self <- "so very lonely"
"so very lonely"
iex> self <- "i have nobody"
"i have nobody"
```

So now we have 3 messages waiting in the mailbox queue. Let's tell our process how to handle it:


```elixir
iex(1)> receive do
…(1)> msg -> "Received: #{msg}"
…(1)> end
"Received: i'm so lonely"

iex(2)> receive do
…(2)> msg -> "Received: #{msg}"
…(2)> end
"Received: so very lonely"

iex(3)> receive do
…(3)> msg -> "Received: #{msg}"
…(3)> end
"Received: i have nobody"
```

What happens if we try to be cheeky and put in another `receive` block? Try it out:

```elixir
iex(4)> receive do
…(4)> msg -> "Received: #{msg}"
…(4)> end
# Nothing happens!
```

Not only nothing happens, but the entire terminal is unresponsive. What gives? 

That brings us to our next exercise!

##A Sneak Peek into Distributed Elixir

![](/images/squid.png)
(Credits: [Learn You Some Erlang for Great Good!](http://learnyousomeerlang.com/))

In our previous exercise, we had one extra `receive` and no messages to process. 

With no messages to handle, the process will simply block. To unblock the process, we need to send a message over. But if the process blocks, we have no way of getting a message to the process …

So how to we get ourselves out of this conundrum?  

###Nodes in action

[Nodes](http://www.erlang.org/doc/reference_manual/distributed.html) are Erlang runtimes that can communicate with each other. I will skip any explanations for now and dive straight into the good bits.

Let's see this in action:

###1. Starting out

Open 2 terminal windows. We will start `iex` with `--sname`. This makes and assigns a short name to the distributed node.

In the first terminal:

```
% iex --sname one
iex(one@benjamintan)>                                 
```

Similarly, in the second terminal:

```
% iex --sname two
iex(two@benjamintan)>                                 
```

Notice that the prompt looks slightly different. In mine, it says `one@benjamintan` and `two@benjamintan` respectively. We will need those information very soon. (Obviously, yours would look different.)

###2. Register the processes

The nodes need to be able to discover where all the processes are. In order for that to happen, we will have to register the respective processes like so:

```elixir
iex(one@benjamintan)> :global.register_name(:term_1, self)                                
```

```elixir
iex(two@benjamintan)> :global.register_name(:term_2, self)                                
```

###3. Let's get stuck!

Let us intentionally block our process in the first terminal:

```elixir
iex(one@benjamintan)> receive do
...(one@benjamintan)> {msg,sender} -> "I was blocked, then I was saved by #{inspect sender}: #{msg}"
...(one@benjamintan)> end                              
```

###4. Connecting the Nodes together!

Here comes the really fun bit. Go to Terminal 2, and connect both nodes together using `Node.connect`:

```elixir
iex(two@benjamintan)> Node.connect :'one@benjamintan'
true                               
```

We need to communicate with the (currently blocked) process in Terminal 1. So we need to find that process:

```elixir
iex(two@benjamintan)> term_1 = :global.whereis_name(:term_1)
#PID<7893.32.0>                             
```

###5. Send the message over!

Now that we have a reference to the process in Terminal 1, we can send a message to it as usual:

```elixir
iex(two@benjamintan)> term_1 <- { "Hurray!", self }
{"Hurray!",#PID<0.32.0>}
```

Now check out what has happened in Terminal 1: 

```elixir
"I was blocked, then I was saved by #PID<8163.32.0>: Hurray!"
```

Sweet.

##Errata to the previous post

In "Minor Gotcha: Where to place the recursive call?" of my previous [post](/blog/2013/07/04/elixir-for-the-lazy-impatient-and-busy-part-3-processes-101/), I wrote that if the recursive call (the second last line) is _not_ within the `receive` block, it would not be executed.

```elixir
def hola do
  receive do
    {sender, msg} ->
      sender <- { :ok, "Received: '#{msg}'. Thank you!" }
  end
  hola # <-- This is executed!
end
```

I was wrong! 

John Warwick was kind enough to send me an email and point me to his [repository](https://github.com/jwarwick/elixir_recv_test) in order to prove that, yes indeed, the `hola` function is called even outside the `receive` block using [ExUnit](http://elixir-lang.org/getting_started/ex_unit/1.html).

He even provided the steps (see comments in the previous post) to run the project.  

I encourage you to take a look at it, because it serves as a wonderful reminder and lesson on how code __always__ wins arguments.

##Next Time …

We shall look the debugging facilities Elixir and Erlang gives us.

Stay tuned and as always, thanks for reading!
