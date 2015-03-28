---
title: "Elixir for the Lazy Impatient and Busy: Part 3 |> Processes 102"
date: 2013-07-04 20:22
comments: true
tags: ["Elixir", "Processes"]
---

This is Part 3 of Elixir for the Lazy, Impatient and Busy - Processes __102__! If you haven't looked at [Part 1](/blog/2013/06/13/elixir-for-the-lazy-impatient-and-busy-lists-and-recursion/) on Lists and Recursion and [Part 2](/blog/2013/06/25/elixir-for-the-lazy-impatient-and-busy-part-2-processes-101/) Processes 101, I encourage you to check those out first.

##Quick Recap

Previously, we looked at creating Elixir processes using `spawn`, then we played with a little bit of message passing using the `<-` operator. 

We took a tiny detour to examine the Actor concurrency model, and also noted that processes are relatively cheap in Elixir.

We left off with this, and noted that there was a big limitation to this code:

```elixir
defmodule Helloer do
  def hola do
    receive do
      {sender, msg} ->
        sender <- { :ok, "Received: '#{msg}'. Thank you!" }
    end
  end
end

helloer_pid = spawn(Helloer, :hola, [])]

helloer_pid <- {self, "Here's a message for you!"}
receive do
  { :ok, msg } -> IO.puts msg
end
```

##What's wrong?

When you run the above program, you will receive a cheerful message: 

`"Received: 'Here's a message for you!'. Thank you!"`

Let's now send another message. 

We'll do it the simplest way possible, by appending another `receive` construct like so:

```elixir
defmodule Helloer do
  def hola do
    receive do
      {sender, msg} ->
        sender <- { :ok, "Received: '#{msg}'. Thank you!" }
    end
  end
end

helloer_pid = spawn(Helloer, :hola, [])]

helloer_pid <- {self, "Here's a message for you!"}
receive do
  { :ok, msg } -> IO.puts msg
end

# Let's send another message
helloer_pid <- {self, "Here's ANOTHER message for you!"}
receive do
  { :ok, msg } -> IO.puts msg
end
```

And to our utter horror: 

We get `"Received: 'Here's a message for you!'. Thank you!"` and then … nothing! 

It just hangs there indefinitely! What's going on?

###`hola` is the culprit

Look at `hola` again. What happens when it receives a message? 

The message comes in, then it sends back a message of its own to `sender`. Then it simply exits. There's nothing to tell `hola` that it should carry on waiting for messages.

So how do we allow `hola` to receive as many messages as we like? Turns out, the answer is pretty simple.

##Recursion has got our back!

The simplest way would be to call itself again. Here's the modified `hola`:

```elixir
def hola do
  receive do
    {sender, msg} ->
      sender <- { :ok, "Received: '#{msg}'. Thank you!" }
      hola # <--- Recursive call ---
  end
end
```

Run it again, and lo and behold:

`"Received: 'Here's a message for you!'. Thank you!"`
`"Received: 'Here's ANOTHER message for you!'. Thank you!"`

###Minor Gotcha: Where to place the recursive call?

I have made this mistake enough times than I have cared to admit:

```elixir
def hola do
  receive do
    {sender, msg} ->
      sender <- { :ok, "Received: '#{msg}'. Thank you!" }
  end
  hola #  <--- Don't do this! ----
end
```

Always put your recursive call _inside_ the `receive` block. Otherwise, when the message is received, the process would exit, without ever reaching the recursive call. 

##Bonus: `:pman`: The Process Manager

Launch `iex` in the terminal, invoke the process manager:

`iex> :pman.start`

![](/images/pman.png)

##Next time …

You might be slightly sick of processes already, but I would do another post on it. That's because processes occupy such a central role in Elixir, and there a couple of other important concepts that I feel are important enough to cover.

Thanks for reading!
