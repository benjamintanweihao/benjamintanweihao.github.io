---
title: "Producer-Consumer problem in Elixir"
date: 2014-10-11 14:53
comments: true
tags: Elixir, Erlang, Concurrency, Producer, Consumer
---

I was searching for an implementation for the [Producer-Consumer](en.wikipedia.org/wiki/Producer–consumer_problem) problem in _Erlang_, but apparently Google wasn't on my side:

<img src="http://i.imgur.com/TWIpBxO.png" style="width:500px"/>

Having had no choice, and seeing enough examples in Java that made my eyes bleed, I was left to try out an implementation on my own. 

## Here is how it looks like

Here's a running example of the implementation I did, with 2 producers and 5 workers:

<img src="https://camo.githubusercontent.com/6678fc22d00b7c630244ce233d243dcf9c7f5d9c/687474703a2f2f692e696d6775722e636f6d2f6932526f5965792e676966" style="width:500px"/>

If you are interested, the repo is located on [GitHub](https://github.com/benjamintanweihao/procon/).

## The Moving Parts

My implementation consists of 3 moving parts: the _producer_, _consumer_, and _manager_. Let's start with the `manager.ex`.

## `manager.ex`

```elixir
defmodule Manager do

  def start(num_workers) do
    spawn(fn -> 
      consumer_pids = Enum.map(1..num_workers, fn _ -> Consumer.start(self) end)
      loop(consumer_pids)
    end)
  end

  def loop([]) do
    receive do
      {:request, producer_pid} ->
        loop([])

      {:done, consumer_pid} ->
        loop([consumer_pid])
    end
  end

  def loop([first | rest] = consumer_pids) do
    receive do
      {:request, producer_pid} ->
        send producer_pid, {:ok, first}
        loop(rest)

      {:done, consumer_pid} ->
        loop([consumer_pid | consumer_pids])
    end
  end

end
```

We begin with `Manager.start/1`:

```elixir
defmodule Manager do

  def start(num_workers) do
    spawn(fn -> 
      consumer_pids = Enum.map(1..num_workers, fn _ -> Consumer.start(self) end)
      loop(consumer_pids)
    end)
  end
  # ...
end
```

The `start/1` function takes in a non-negative integer, and in return, spawns up `num_workers` of `Consumer`s. The resulting `consumer_pids`, a list of consumer pids, that are the passed in as the argument for `loop/1`.

The main idea is consumers that are _available_ will be part of the loo's arguments. This leads naturally to 2 cases, either we have consumers, or we don't:

#### Case 1: No more consumers

This means that all our consumers are busy.

```elixir
defmodule Manager do
  # ...
  def loop([]) do
    receive do
      {:request, producer_pid} ->
        loop([])

      {:done, consumer_pid} ->
        loop([consumer_pid])
    end
  end
```

Whenever a producer had something to produce, it will send a `{:request, producer_pid}` message to the manager. In this case, the manager is busy, so it will simply not respond, and call loop on itself.

Whenever a consumer had completed processing something, it will send a message to the manager with a `{:done, consumer_pid}`. This also means that the said consumer is available for a new job. Therefore the loop contains that `consumer_pid`.

#### Case 2: Happy path

```elixir
defmodule Manager do
  # ...
  def loop([first | rest] = consumer_pids) do
    receive do
      {:request, producer_pid} ->
        send producer_pid, {:ok, first}
        loop(rest)

      {:done, consumer_pid} ->
        loop([consumer_pid | consumer_pids])
    end
  end
end
```

Compare this with the previous case. Here, we can reply to the producer with `{:of, first}`, where `first` is the first pid in the list of `consumer_pids`. When `{:done, consumer_pid}` is received from the consumer, then `consumer_pid` is prepended to the list of `consumer_pids`.

## `producer.ex`

Now let's turn our attention to the producer:

```elixir
defmodule Producer do
  @timeout 2000

  def start(manager_pid) do
    spawn(fn -> run(manager_pid) end)
  end

  def run(manager_pid) do
    Stream.repeatedly(fn ->
      send manager_pid, {:request, self} 

      receive do
        {:ok, consumer_pid} ->
          :random.seed(:erlang.now)
          send consumer_pid, {:run, :random.uniform(3)}

      after @timeout ->
        send manager_pid, {:request, self} 
      end
    end) |> Enum.to_list
  end

end
```

When we start the producer, we supply the `manager_pid`, so that both parties can communicate:

```elixir
defmodule Producer do
  @timeout 2000

  def start(manager_pid) do
    spawn(fn -> run(manager_pid) end)
  end
  # omitted ...
end
```

In order to simulate a never ending stream, I used `Stream.repeatedly/1` and `Enum.to_list`:

```elixir
defmodule Producer do
  # ....
  def run(manager_pid) do
    Stream.repeatedly(fn ->
      # ...
    end) |> Enum.to_list
  end
end
```

Now, let's take a look at the messages being sent and received:

```elixir
defmodule Producer do
  # ....
  def run(manager_pid) do
    Stream.repeatedly(fn ->
      send manager_pid, {:request, self} 

      receive do
        {:ok, consumer_pid} ->
          :random.seed(:erlang.now)
          send consumer_pid, {:run, :random.uniform(3)}

      after @timeout ->
        send manager_pid, {:request, self} 
      end
    end) |> Enum.to_list
  end
end
```

Just _before_ the `receive` block, the producer first sends a request to the manager for a `consumer_pid`. If it gets one, then it will send a message to the consumer to run the job.

Here's the slightly more interesting bit: If it _doesn't_ receive a reply, we _timeout_ after `@timeout` (2 seconds, in this case), _and_ send the another request again. Why will this timeout in the first place? That's because the manager will simply not answer a request if there are _no consumers available_.

## `consumer.ex`

Implementing the consumer is simple:

```elixir
defmodule Consumer do

  def start(manager_pid) do
    spawn(fn -> loop(manager_pid) end)
  end

  def loop(manager_pid) do
    receive do
      {:run, work} ->
        :timer.sleep(work * 1000)
        send manager_pid, {:done, self}
        loop(manager_pid)
    end
  end

end
```

Similar to the producer, we pass in the `manager_pid` because the consumer needs to talk to the manager. The consumer only responds to one message, `{:run, work}`. All it does is sleep a couple of seconds (to simulate doing work), then inform the manager that it should be added back into the list of available `consumer_pids`.

## That's it! 

This little exercise took me quite a while to complete, because I hit into starvation issues along the way, although that was due to a bad pattern match on my part.

This technique might come in useful when the producer produces more data than the consumers can handle, and we have to tell the producer to slow down somehow.

## One more thing ...

![](https://s3.amazonaws.com/erlang-in-anger/book-cover.png)

I've started reading [Erlang in Anger](http://www.erlang-in-anger.com/), __a free ebook__ by Fred Hebert, of Learn You Some Erlang for Great Good! fame. Lots of interesting stuff and advice on running Erlang in production. Highly recommend reading it.

Thanks for reading!

