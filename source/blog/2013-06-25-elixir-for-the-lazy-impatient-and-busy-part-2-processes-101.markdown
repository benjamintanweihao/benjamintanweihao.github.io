---
title: "Elixir for the Lazy Impatient and Busy: Part 2 |> Processes 101"
date: 2013-06-25 09:43
comments: true
tags: ["Elixir", "Processes", "Concurrency"]
---

Welcome to Part 2 of Elixir for the Lazy, Impatient and Busy! In [Part 1](/blog/2013/06/13/elixir-for-the-lazy-impatient-and-busy-lists-and-recursion/), we took a whirlwind tour on __Lists and Recursion__. We are now going to do the same for __Processes__.

##Elixir Processes ≠ OS Processes

As an Elixir programmer, you don't have to mess with nasty operating system processes. Instead, we rely on the battle-tested Erlang Virtual Machine to handle all that heavy lifting for us.

In fact, you could happily spawn 5000 (and more!) processes and all your CPUs will happily light up. I always get a warm, fuzzy feeling knowing that I am getting my money's worth of hardware.

##Actor Concurrency Model

Before we get coding, you should know that Elixir/Erlang uses the [Actor Concurrency Model](http://en.wikipedia.org/wiki/Actor_model). 

![](/images/hello.png)

Credits: http://learnyousomeerlang.com

Here's my explanation: 

1) Each Actor is a Process.

2) Each Process performs a specific task.

3) To tell a Process to do something, you need to send in a message. The Process can also send back another message.

4) The kinds of messages the process can act upon is specific to the process itself.

5) Other than that, processes do not share any information with other processes.

##Creating Processes

Here's some code that we want to run in a separate process:

```elixir
defmodule Helloer do
  def hola(msg) do
    IO.puts "Hola! #{msg}"
  end
end

IO.puts "Parent process is #{inspect self}" 
IO.puts "Spawned process is #{inspect spawn(Helloer, :hola, ['Elixir is awesome'])}"
```

In order to do this, we use the `spawn/3` function, like so:

```elixir
spawn(Helloer, :hola, ["Elixir's awesome!"])
```

As you can guess, the first argument is the module name, followed by the function name (with a colon), then an array of arguments.

Running this code gives us:

```elixir
Parent process is #PID<0.2.0>
Spawned process is #PID<0.37.0>
Hola! Elixir is awesome
```

Congratulations! You have just learnt how to spawn a process.

Before you continue, it would be good to browse the awesome [documentation](http://elixir-lang.org/docs/master/), type in `spawn` in the search bar, and check out the different versions. 

Come back when you are done.

##Communicating with Processes

Simply `spawn`-ing our processes is not much fun. How do we send messages?

Firstly, it is important to know that the return value of `spawn` (and its close cousins, `spawn_link` and `spawn_monitor`) is the __pid__, also know as the __process id__. 

The __pid__ is the _reference_ to the process. So you want to send messages to a process? You have to send it through the __pid__.

###Sending messages with `<-` and `receive`-ing messages

The fun begins:

```elixir
defmodule Helloer do
  def hola do
    receive do
      {sender, msg} -> 
        sender <- "Received: '#{msg}'. Thank you!"
    end
  end
end

helloer_pid = spawn(Helloer, :hola, [])
helloer_pid <- {self, "Here's a message for you!"}

receive do
  msg -> IO.puts msg
end
```

Running this code gives:
 
```elixir
Received: 'Here's a message for you!'. Thank you!
```

Let's break this code down:

We want to send a message to the `hola` function via a process. To do that, we first need a reference to a process. And to do that, we have our friend, `spawn`:

```elixir
helloer_pid = spawn(Helloer, :hola, [])
```

Notice that this time, we are not passing anything into the argument list. We will be sending a message to it instead, using the `<-` operator.

```elixir
helloer_pid <- {self, "Here's a message for you!"}
```

The left of the arrow is the `pid` that we want to send the message to. The right of the arrow is the message.

We are sending a tuple over to the `helloer_pid` the message `{self, "Here's a message for you!"}`. 

What is `self`? `self` is a function that returns the __pid__ of the calling process. Why do we need to pass `self`? So we can send a message back to the calling process!

Before we get a little ahead of ourselves, we need to figure out how to receive messages. Recall now we are sending a message that looks like `{self, "Here's a message for you!"}` to `hola`.

Look at `hola` and the `receive` block. Notice the `{sender, msg}` tuple. Because incoming message has the same _pattern_, `hola` can happily handle this, and therefore execute the code on the right hand side of the `->`:

```elixir
sender <- "Received: '#{msg}'. Thank you!"
```

Now `hola` has received the message. The message contains a reference to the calling process. Using `<-`, we can send another message back to the calling process!

But, recall that the calling process needs to handle incoming messages too:

```elixir
receive do
  msg -> IO.puts msg
end
```

In this case, the calling process is just expecting a single item, which is exactly what `hola` is sending over with `"Received: '#{msg}'. Thank you!"`

###Next time … 

I hope your brain is hurting a little by now.

There's more to processes I want to talk about. In particular, there's a big limitation to the `hola` function - It can only handle receiving one message! 

We'll see how we can use recursion to elegantly sidestep this limitation.

Thanks for reading!
