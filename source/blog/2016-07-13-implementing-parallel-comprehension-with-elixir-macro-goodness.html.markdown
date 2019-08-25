---
title: Implementing Parallel Comprehension with Elixir Macro Goodness
date: 2016-07-13 13:50 UTC
tags: Elixir, Macros, Metaprogramming
---

I have been ploughing through Chris McCords' [Metaprogramming Elixir](https://pragprog.com/book/cmelixir/metaprogramming-elixir) book. In one of the chapters, he talks about how Macros are key in extending Elixir. An example he gave was that of a _parallel_ comprehension. Also, if you have no idea what Macros are, you should do either or both of this things:

1. Buy Metaprogramming Elixir.
2. Read Saša Jurić's outstanding series on Macros. [Here's Part 1](http://theerlangelist.com/article/macros_1).
3. Throw caution to the wind and try out the example anyway.

Let's jump straight in! Here's a normal comprehension:

```
for i <- 1..10, do: i * i
```

And here's how a parallel one could look like:

```
para(for i <- 1..10, do: i * i)
```

In this case, `para` is a Macro that runs the body of the comprehension (`i * i`) in _ten_ proceses, and returns the result.

I don't recall the book containing the actual implementation, but that's great! This post will cover how I implemented this from scratch. Also, I have _one_ week of Macro experience at the time of this post. What could go wrong?

## Look Ma, No Macros!

Before we go metaprogramming crazy, let's consider how a _non_-Macro solution would look like. Here's a sketch:

```elixir
me = self

pids = for i <- 1..10 do
  spawn(fn -> send(me, {self, i * i}) end)
end

pids |> Enum.map(fn pid -> 
  receive do
    {^pid, result} -> result
  end
end)
```

If this reminds you of parallel map, you're absolutely right! The only difference here is that the comprehension allows you to have generators and filters so that you can tailor the generated values to your needs. For those who have not seen the code before, let's unpack the code, because I think it's pretty cool.

First, we save a reference to the pid of the current process in `me`.

```elixir
me = self
```

Why? Because the value of `self` changes, like when you are inside a `spawn` for example. We are saving the pid of the current process so that we can send messages to it. In fact, this is the next thing we do: 

```elixir
pids = for i <- 1..10 do
  spawn(fn -> send(me, {self, i * i}) end)
end
```

We execute the comprehension here, but instead of merely executing `i * i`, we wrap the computation in a function and pass it to `spawn`. We are effectively running the computation (again, `i * i`) in a separate process. Of course, we are not simply running the computation in a separate process. If you look closely, we are sending a message of `{self, i * i}` to `me`. Therefore, once all the computation is done, `me` will receive _ten_ messages in its mailbox. 

It's important to realize that the messages can come _out of order_. Imagine that the first process takes 10 seconds to complete while the rest takes less than a second. This means that the _first_ process would finish its task _last_, which also means that the message would be seen last. We definitely want to preserve the order of the results coming back. That's the purpose of the final piece of code:

```elixir
pids |> Enum.map(fn pid -> 
  receive do
    {^pid, result} -> result
  end
end)
```

We know that the `pids` contain an ordered list of pids created. When `map`ped with a `receive` block _and_ matching on the `pid`, we can be sure that we are matching the `pid` with the return value. Notice that the `^` in `^pid` is _super_ important here, otherwise the `pid` in `fn pid -> ... end` and `{pid, result}` wouldn't be matched.

So now we have a plan of attack. We have a basic idea of how to implement parallel comprehension using processes. Time to metaprogram this thing.

## Macros, Macros Everywhere...

Let's start with a new module and Macro definition:

```elixir
defmodule MacroPlayground do
    
  defmacro para(ast) do
    me = self
  
  end

end
```

I've named the input argument `ast`, short of Abstract Syntax Tree. This is a good reminder that Macros take in ASTs and spit out ASTs. What we do _inside_ of the Macro is the fun stuff.

Here's the plan. Given a comprehension such as `for i <- 1..10, do: i * i`, extract the `do` part (`i * i`) and turn it into this:

```elixir
spawn(fn -> send(me, {self, i * i}) end)
```

Then, we will add the rest of the pieces such as the code for `map`ping `pids` against the `receive` block.

When working with ASTs, it's important to understand how the AST is being represented. For example, you can wrap an expression around a `quote` block:

```elixir
quote do
  for(i <- 1..10, do: i * i)
end
```

This evaluates to:

```elixir
{:for, [],
 [{:<-, [],
   [{:i, [], Elixir}, {:.., [context: Elixir, import: Kernel], [1, 10]}]},
  [do: {:*, [context: Elixir, import: Kernel],
    [{:i, [], Elixir}, {:i, [], Elixir}]}]]}
```

We need to replace the `do` block with our "spawn" version. How do we do that? `Macro.prewalk/2` to the rescue! There's `Macro.postwalk/2` too. So what's the difference? Observe:

First we'll create the AST:

```elixir
iex> ast = quote do
...> for(i <- 1..10, do: i * i)
...> end
```

Prewalk:

```elixir
iex> Macro.prewalk(ast, fn node -> IO.puts "-> #{inspect node}" end)
```

This returns:

```elixir
-> {:for, [], [{:<-, [], [{:i, [], Elixir}, {:.., [context: Elixir, import: Kernel], [1, 10]}]}, [do: {:*, [context: Elixir, import: Kernel], [{:i, [], Elixir}, {:i, [], Elixir}]}]]}
```

What about Postwalk?

```elixir
iex(20)> Macro.postwalk(ast, fn node -> IO.puts "-> #{inspect node}" end)
Macro.postwalk(ast, fn node -> IO.puts "-> #{inspect node}" end)
```

This time, the result is different:

```elixir
-> {:i, [], Elixir}
-> 1
-> 10
-> {:.., [context: Elixir, import: Kernel], [:ok, :ok]}
-> {:<-, [], [:ok, :ok]}
-> :do
-> {:i, [], Elixir}
-> {:i, [], Elixir}
-> {:*, [context: Elixir, import: Kernel], [:ok, :ok]}
-> {:ok, :ok}
-> [:ok]
-> {:for, [], [:ok, :ok]}
```

What `Macro.prewalk/2`/`Macro.postwalk/2` does is it takes an AST and traverse it. At each node, it applies the given funcion. That is exactly what we need. We will traverse the AST, pick out the node that matches a comprehension, then replace the `do` block with the "`spawn`" version.

Here's the full implementation. Scroll down further for the step by step explanations.

```elixir
defmodule MacroPlayground do

  defmacro para(ast) do
    # 0. Store the pid of the current process
    me = self

    # 6. Save the resulting pids
    pids = Macro.prewalk(ast, fn
      # 1. Pattern matching can be done with function arguments!
      {:for, meta, args} ->
        # 2. Extract the do block of the comprehension
        [do: do_block] = args |> List.last

      # 3. Wrap the do block around a spawn. Send the result to the
      #    current process.
      spawn_do_block = quote do
        spawn(fn -> send(unquote(me), {self, unquote(do_block)}) end)
      end

      # 4. Swap out the `do_block` (the last element of `args`)
      #    with the `spawn_do_block`
      {:for, meta, List.replace_at(args, -1, [do: spawn_do_block])}

      # 5. We just output the same node for any other node
      node ->
        node
    end)

    # 7. Collect the results
    quote do
      unquote(pids)
      |> Enum.map(fn pid ->
        receive do
          {^pid, result} ->
            result
        end
      end)
    end
  end
end
```

The function we are passing to `Macro.prewalk/2` matches on two cases. The first case is when we encounter a node that is a comprehension, and that happens when there's a match for `{:for, meta, args}` (Step 1). Otherwise, we simply emit the same node, leaving it unchanged (Step 5).

Take a look at the AST again:

```elixir
{:for, [],
 [{:<-, [],
   [{:i, [], Elixir}, {:.., [context: Elixir, import: Kernel], [1, 10]}]},
  [do: {:*, [context: Elixir, import: Kernel],
    [{:i, [], Elixir}, {:i, [], Elixir}]}]]}
```

Here, `meta` is `[]` while `args` is this chunk:

```elixir
 [{:<-, [],
   [{:i, [], Elixir}, {:.., [context: Elixir, import: Kernel], [1, 10]}]},
  [do: {:*, [context: Elixir, import: Kernel],
    [{:i, [], Elixir}, {:i, [], Elixir}]}]]
```

Our goal is to get to the `do` bit. Thankfully, `args` is just a `List`. And the `do` bit is the last element (Step 2):

```elixir
[do: do_block] = args |> List.last
```

Now that we have the AST of the `do_block`, we can inject this into the `spawn` (Step 3). We create a new AST with the `quote` and in it we have the `spawn` expression:

```elixir
spawn(fn -> send(unquote(me), {self, unquote(do_block)}) end)
```

Remember, having an expression inside a `quote` block turns it into an AST. We need to `unquote(me)` and `unquote(do_block)` in order to use its value inside the quoted expression. Finally, we savse the resulting AST into `spawn_do_block`:

```elixir
spawn_do_block = quote do
  spawn(fn -> send(unquote(me), {self, unquote(do_block)}) end)
end
```

Now, we can perform the sleight-of-hand. We simply replace the last element of `args` with `[do: spawn_do_block]`, effectively transforming the resulting AST of the orignal comprehension (Step 4):

```elixir
{:for, meta, List.replace_at(args, -1, [do: spawn_do_block])}
```

Recall that when the comprehension executes with `spawn`s, the result is going to be a list of pids. As with the non-Macro version, the result of the comprehension is saved in the `pids` (Step 6).

Finally, we need to collect the results by matching pids.

```elixir
quote do
  unquote(pids)
  |> Enum.map(fn pid ->
    receive do
      {^pid, result} ->
        result
    end
  end)
end
```

Again, since we need to be dealing with ASTs, we need to wrap

```elixir
pids |> Enum.map(fn pid ->
  receive do
    {^pid, result} ->
      result
  end
end
```

in a `quote` block. However, as with `me` and `do_block`, `pids` has to be unquoted in order for it to be used in a quoted expression.

## Taking it for a spin

```elixir
defmodule Foo do
  import MacroPlayground

  def foo do

    x = para(for a <- 1..10,
      b <- 1..10,
      c <- 1..10,
      a + b + c <= 10000,
   do: {a, b, c})

    IO.inspect x
  end
end

Foo.foo
```

This will give:

```
[{1, 1, 1}, {1, 1, 2}, {1, 1, 3}, {1, 2, 1}, {1, 2, 2}, {1, 3, 1}, {2, 1, 1},
 {2, 1, 2}, {2, 2, 1}, {3, 1, 1}]
```

For good measure, you can `inspect` the pid when the results are received:

```elixir
receive do
  {^pid, result} ->
    IO.inspect pid  # <-- add this line
    result
end
```

You should be able to see this:

```elixir
#PID<0.2170.0>
#PID<0.2171.0>
#PID<0.2172.0>
#PID<0.2173.0>
#PID<0.2174.0>
#PID<0.2175.0>
#PID<0.2176.0>
#PID<0.2177.0>
#PID<0.2178.0>
#PID<0.2179.0>
[{1, 1, 1}, {1, 1, 2}, {1, 1, 3}, {1, 2, 1}, {1, 2, 2}, {1, 3, 1}, {2, 1, 1},
 {2, 1, 2}, {2, 2, 1}, {3, 1, 1}]
```

Great Success! Hopefully this was educational. I took a while to figure this out, so don't feel bad if you don't get it the first time round. If you spot any mistakes or have suggestions for improvements, please do so in the comments. Thanks for reading!
