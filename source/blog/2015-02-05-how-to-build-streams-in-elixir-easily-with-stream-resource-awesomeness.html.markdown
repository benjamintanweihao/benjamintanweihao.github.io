---
title: How to build Streams in Elixir easily with Stream.resource/3 Awesomeness
date: 2015-02-05 06:32 UTC
tags: Elixir, Streams
---

Streams are fascinating. They are fascinating because Streams allow us to model infinite data. In addition, we can _compose_ streams together to form another stream. The possibilities are _endless_ – pun intended!

I have covered streams in a [previous](/blog/2013/08/14/elixir-for-the-lazy-impatient-and-busy-part-5-streams-streaming-dynamo/) post many moons ago. But let's revisit the basics a bit, because why not?

After a quick revision, we will learn how to create our own streams, along with a very fun project to make sure the concepts sink in. Let's do this!

## Stream Basics

Streams are enumerables that are _composable_ and _lazy_. Let's talk being lazy first, or rather, what it means to be _not_ lazy.

### Streams are Lazy

For example, when you use `map/2` of the `Enum` module, the values are _eagerly_ computed. That's just a fancy of saying that the results return immediately:

```elixir
iex> [1, 2, 3] |> Enum.map(&(&1 * &1))
[1, 4, 9]
```

By contrast, what happens when we use `Stream` module instead?

```elixir
[1, 2, 3] |> Stream.map(&(&1 * &1))
#Stream<[enum: [1, 2, 3],
 funs: [#Function<45.29647706/1 in Stream.map/2>]]>
```

Well, we see a Stream being returned, but no `[1, 4, 9]` in sight. This is what is meant by being lazy. _Unless absolutely necessary_, the stream will not return a value. There are a couple of ways to compel the Stream to return a result. All of it involves a call to one of the functions in `Enum`:

```elixir
iex> [1,2,3] |> Stream.map(&(&1 * &1)) |> Enum.take(2)            [1, 4]
```

Calling the eager functions in `Enum` basically breaks the chain of laziness of the stream. This brings us to the next point.

### Streams are Composable

We know that streams are lazy. Because streams don't evaluate immediately, we can happily compose them together to combine computations. But can't we do this with existing `Enum` functions? Sure you can, if your input is manageable. Let's imagine we have a crazy large input:

```elixir
wikipedia_titles = [...] # A list of a gazillion elements in it
``` 

Then let's say we wanted to capitalize the Wikipedia titles. Therefore, we need to `map/2` the `String.upcase/1` function on `wikipedia_titles`:

```elixir
wikipedia_titles |> Enum.map(&(String.upcase(&1))
``` 

Finally, let's just a assume that we are interested in the first  10 articles. `take/2` is just the function for that:

```elixir
wikipedia_titles 
	|> Enum.map(&(String.upcase(&1)) 
	|> Enum.map(&(String.reverse(&1)) 
	|> Enum.take(10)
```

Trace the program and think about what would happen. You would realise that although we only wanted 10 capitalized Wikipedia titles, because of eager evaluation, we had to capitalized _all gazillion_ entries first, _then_ reverse _all gazillion entries, before picking out the first 10. That is just plain wasteful.

Consider this version instead using `Stream`:

```elixir
wikipedia_titles 
	|> Stream.map(&(String.upcase(&1)) 
	|> Stream.map(&(String.reverse(&1)) 
	|> Enum.take(10)
```

When we replace `Enum.map/2` with `Stream.map/2`, both `String.upcase/2` and `String.reverse/2` are invoked only 10 times. We don't have to worry that mapping will take long because we are doing the _bare minimum_ when we use the `Stream` module. This is why streams are awesome!

## Building Your Own Streams

Here's the super fun part. We are going to learn how to create our own streams. We will go through two examples. The first example will be lame, but it will give you a feel of the general idea. The second is even more impractical, but will be very fun to play with.

### Infinite Number Stream

Let's assume for a moment that we are blissfully unaware of functions that allow us to create infinite streams of numbers. Therefore, we are going to implement this functionality in a module called `Streamy`. 

If you are following along go ahead and save the following in a file called `streamy.ex`:

```elixir
defmodule Streamy do
  
  def from(start) do
    Stream.resource(
      fn -> start end,
      fn(num) -> 
        case num do 
          num when num < 1000 -> 
            {[num + 1], num + 1} 
          _ ->
            {:halt, num}
        end
      end,
      fn(num) -> num end
    )
  end

end
```

Here's what I am after:

```elixir
% iex streamy.ex
iex> Streamy.from(10) |> Stream.map(&(&1*2)) |> Enum.take 5
[22, 24, 26, 28, 30]
```

### Building Streams with Stream.resource/3

The key to creating your own streams is `Stream.resource/3`. The key to _understanding_ `Stream.resource/3` is to pay attention to the three input arguments. In particular, _the inputs and outputs of the functions that are to be passed to `Stream.resource/3`_:

```elixir
Stream.resource(start_function, 
                next_function, 
                after_function)
```

Here are the rules:

#### Argument 1 – The Start Function

The `start_function` that you pass into `Stream.resource/3` sets up the resource and returns it. This function:

* doesn't take any arguments
* returns the resource

The resource could be a file handle, socket connection, or in our case, the initial number:

```elixir
fn -> start end
```

See? Super simple.

### Argument 3 – The After Function

Let's do the `after_function` before doing `next_function`. It is called "after" because this is the final function that is called once the stream is done spitting out values.

This function:

* takes the resource as the input argument
* handles any cleanup that is required

```elixir
fn resource ->
  # handle clean up of the resource
  # e.g. File.close(resource), IO.close(resource)
end
```

### Argument 2 - The Next Function

The `next_function` is where all the action is at. Conceptually, it is simple: This function:

* takes the resource as the input argument

The return value must __conform to a specific format__. In particular, it must:

* return a __tuple__ that contains a _list_ of items to be emitted (I was tempted to say "spitted") and __the next accumulator__. Therefore, the function has the following shape:

```elixir
fn resource ->
	case read_from_resource do
    data -> {[data], accumulator}
end
```

The point here is to take note of the _return value_, because that is what `Stream.resource/3` expects you to return. Any deviation and you get weird errors.

Let's say you encounter an error, or you have exhausted the resource (end of file, for example). In that case, you should return `{:halt, accumulator}`

```elixir
fn resource ->
	case read_from_resource do
    data -> {[data], accumulator}
    _    -> {:halt, accumulator}
end
```

#### What's Accumulator?

Accumulator means different things given different situations. Here's the way I like to think about it:

If you are setting up a file, socket, database connection etc, then `accumulator` is that file handle, socket or database connection. There's nothing to accumulate per se, but it's more like "bringing forward" to the next invocation of the stream.

Here's an example take right out of the docs:

```elixir
Stream.resource(fn -> File.open!("sample") end,
                fn file ->
                  case IO.read(file, :line) do
                    data when is_binary(data) -> {[data], file}
                    _ -> {:halt, file}
                  end
                end,
                fn file -> File.close(file) end)
```

Notice that the accumulator is always `file`. The only sane thing to do is pass along the file handle each time we request a value from the stream. Also notice that `data` is wrapped in a _list_. I got stung by this a few times before – you've been warned.

On the other hand, if the value you generate now depends on the previous value generated, then `accumulator` functions in the truest sense of the word. Here's the infinite number generator again:

```elxir
defmodule Streamy do
  
  def from(start) do
    Stream.resource(
      fn -> start end,
      fn(num) -> 
        case num do 
          num when num < 1000 -> 
            {[num + 1], num + 1} 
          _ ->
            {:halt, num}
        end
      end,
      fn(num) -> num end
    )
  end

end
```

Notice what happens when we purposely halt the stream by starting with a number close to 1000:

```elixir
iex> Streamy.from(996) |> Stream.map(&(&1*2)) |> Enum.take 5
[1994, 1996, 1998, 2000]
```

 In this case, only four values were generated. Hopefully by now, the infinite number generator makes sense, and you have a better idea how it works.