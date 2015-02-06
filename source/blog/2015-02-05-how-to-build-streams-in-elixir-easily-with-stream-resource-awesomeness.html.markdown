---
title: How to build Streams in Elixir easily with Stream.resource/3 Awesomeness
date: 2015-02-05 06:32 UTC
tags: Elixir, Streams
---

Streams are fascinating. They are fascinating because Streams allow us to model infinite data. In addition, a stream can be _composed_ together to form other stream. The possibilities are _endless_ – pun intended!

I have covered streams in a [previous](/blog/2013/08/14/elixir-for-the-lazy-impatient-and-busy-part-5-streams-streaming-dynamo/) post many moons ago. But let's revisit the basics a bit, because why not?

After a quick revision, we will learn how to create our own streams, along with a very fun project to make sure the concepts sink in. Let's do this! 

If you are impatient, here's a taste:

<iframe width="420" height="315" src="https://www.youtube.com/embed/wnI0z514jmA" frameborder="0" allowfullscreen></iframe>

## Stream Basics

Streams are enumerables that are _composable_ and _lazy_. Let's talk being lazy first, or rather, what it means to be _not_ lazy.

### Streams are Lazy

When you use `map/2` of the `Enum` module, the values are _eagerly_ computed. That's just a fancy of saying that the results return immediately:

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

Well, we see a Stream being returned, but no `[1, 4, 9]` in sight. This is what is meant by being lazy. _Unless absolutely necessary_, the stream will not return a value. There are a couple of ways to compel the Stream to return a result. All of them involve a call to one of the functions in `Enum`:

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

Finally, let's just assume that we are interested in the _first  10_ articles. `take/2` is just the function for that:

```elixir
wikipedia_titles 
	|> Enum.map(&(String.upcase(&1)) 
	|> Enum.map(&(String.reverse(&1)) 
	|> Enum.take(10)
```

Trace the program and think about what would happen. You would realise that although we only wanted 10 capitalized Wikipedia titles, because of eager evaluation, we had to capitalized _all gazillion_ entries first, _then_ reverse _all gazillion entries_, before picking out the first 10. That is just plain wasteful.

Consider this version instead using `Stream` instead:

```elixir
wikipedia_titles 
	|> Stream.map(&(String.upcase(&1)) 
	|> Stream.map(&(String.reverse(&1)) 
	|> Enum.take(10)
```

When we replace `Enum.map/2` with `Stream.map/2`, both `String.upcase/2` and `String.reverse/2` are invoked only 10 times each. We don't have to worry that mapping will take long because we are doing the _bare minimum_ when we use the `Stream` module. This is why streams are awesome!

## Building Your Own Streams

We are now going to learn how to create our own streams. We will go through two examples. The first example will be lame, but it will give you a feel of the general idea. The second is even more impractical, but will be very fun to play with.

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

Time to learn the rules.

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

###### What is thes Accumulator?

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

### Click Stream

In the next example, we going to generate a stream using _mouse coordinates_ as the data source. The full source code can be found on [GitHub](https://github.com/benjamintanweihao/click_stream).

##### Setting Up the Project

The first order of things is to set up a project with `mix`:

```
% mix new click_stream
```

Here's the source in its entirety, to be placed in `lib/click_stream.ex`:

```elixir
defmodule ClickStream do
  require Record
  Record.defrecordp :wx, Record.extract(:wx, from_lib: "wx/include/wx.hrl")

  @title 'Click Stream'

  def create_stream_x do
    Stream.resource(fn -> create_frame end,
                    fn(frame) -> loop_x(frame) end,
                    fn(frame) -> destroy_frame(frame) end)
  end 

  def create_stream_y do
    Stream.resource(fn -> create_frame end,
                    fn(frame) -> loop_y(frame) end,
                    fn(frame) -> destroy_frame(frame) end)
  end 

  def create_frame do
    wx    = :wx.new
    frame = :wxFrame.new(wx, -1, @title)
    :wxWindow.connect(frame, :close_window)
    :wxWindow.connect(frame, :motion)
    :wxFrame.show(frame)
    frame
  end
  
  def loop_x(frame) do
    receive do
      {:wx, _, _, _, {:wxMouse, :motion, x, _y, _, _, _, _, _, _, _, _, _, _}} ->
        IO.puts "x: #{x}"
        {[x], frame}
      {:wx, _, {:wx_ref, _, :wxFrame, []}, [], {:wxClose, :close_window}} ->
        {:halt, frame}
      _ ->
        {:halt, frame}
    end
  end

  def loop_y(frame) do
    receive do
      {:wx, _, _, _, {:wxMouse, :motion, _x, y, _, _, _, _, _, _, _, _, _, _}} ->
        IO.puts "y: #{y}"
        {[y], frame}
      {:wx, _, {:wx_ref, _, :wxFrame, []}, [], {:wxClose, :close_window}} ->
        {:halt, frame}
      _ ->
        {:halt, frame}
    end
  end

  def destroy_frame(frame) do
    :wxFrame.destroy(frame)
  end

end
```

Although the file seems relatively lengthy, a closer inspection would reveal that `create_stream_x/0` and `create_stream_y/0` are almost identical, except for the invocation of the `loop_x/0` and `loop_y/0` respectively.

`create_stream_x/0` reports the mouse's x-coordinates. Same story for `create_stream_y/0.` 

### A Quick Demo

Here is what we want to do:

<iframe width="420" height="315" src="https://www.youtube.com/embed/wnI0z514jmA" frameborder="0" allowfullscreen></iframe>

### A Revisit to Stream.resource/3

Let's take a closer look at `create_stream_x/0`:

```elixir
def create_stream_x do
  Stream.resource(fn -> create_frame end,
                  fn(frame) -> loop_x(frame) end,
                  fn(frame) -> destroy_frame(frame) end)
end 
```

Recall that the first argument of `Stream.resource/3` takes in a function that sets up and returns the resource. In this case, the resource is a wxWidget frame. No worries if you have no idea what wxWidget is. All you have to know is that wxWidget is a GUI library, and `frame` is a reference to a GUI window. 

The last argument tears down the resource. In this case, we teardown the resource by destroying the frame.

The fun part is in `loop_x/1`:

```elixir
def loop_x(frame) do
  receive do
    {:wx, _, _, _, {:wxMouse, :motion, x, _y, _, _, _, _, _, _, _, _, _, _}} ->
      IO.puts "x: #{x}"
      {[x], frame}
    {:wx, _, {:wx_ref, _, :wxFrame, []}, [], {:wxClose, :close_window}} ->
      {:halt, frame}
    _ ->
      {:halt, frame}
  end
end
```

The loop here executes the receive block each time it is called.  In wXwidget, messages are sent to `self` whenever an event is triggered. 

What kinds of events are there? In the above code, we are only concerned with two kinds – the motion event triggered by mouse movement, and the closing of the window.

I'd be the first to admit that the pattern to be matched looks extremely funky, but hey, it gets the job done. When the first pattern matches (`{:wx, _, _, _, {:wxMouse, :motion, x, _y, _, _, _, _, _, _, _, _, _, _}}`), the tuple `{[x], frame}` is returned. Once again, `x` – the x-coordinate of the mouse position` – is wrapped in a list. It is followed by the accumulator, which in this case, is the frame – the resource.

If the window is closed, or we get an unexpected message, we simply signal a close of the stream by returning `{:halt, frame}`.

That is really all to it! 

### Running Click Stream

Let's run the project:

```
% iex -S mix
```

Next, we will create a stream that _lazily_ reports the x-coordinates of the mouse movement:

```
iex> stream = ClickStream.create_stream_x
#Function<25.29647706/2 in Stream.resource/3>
```

Let's only display the first 10 x coordinates that are less than 100. When you run the code, you will see a window appear. Run your mouse over it. 

Because we placed an `IO.puts/1`, we can see all the `x` values that are being reported. Once 10 eligible values are created, the window is closed, and the return result is displayed:

```elixir
iex> stream |> Stream.filter(fn x -> x < 100 end) |> Enum.take 10
x: 376
x: 376
x: 376
x: 13
x: 13
x: 15
x: 16
x: 17
x: 18
x: 20
x: 21
x: 22
x: 22
[13, 13, 15, 16, 17, 18, 20, 21, 22, 22]
```

Recall that streams are _composable_. This means that we can create another stream from existing ones. One way we can do that is through the `Stream.zip/2` function, which takes in two streams and zips them up. 

First, we create a new stream from two other streams:

```elixir
iex> new_stream = Stream.zip(ClickStream.create_stream_x, ClickStream.create_stream_y)
#Function<6.29647706/2 in Stream.zip/2>
```

Let's take 10 values from this new stream. Just like in the previous case, a window pops up. Fiddle with the mouse a bit until 10 values are generated:

```elixir
iex> new_stream |> Enum.take 10
x: 380
y: 144
x: 359
y: 147
x: 340
y: 150
x: 329
y: 153
x: 316
y: 157
x: 307
y: 160
x: 299
y: 160
x: 298
y: 156
x: 296
y: 154
x: 282
y: 148
[{380, 144}, {359, 147}, {340, 150}, {329, 153}, {316, 157},
 {307, 160}, {299, 160}, {298, 156}, {296, 154}, {282, 148}]
```

#### Other Examples of Streams (Or: When GitHub > Google)

When I was learning how `Stream.resource/3` worked, _looking at other people's code and finding patterns_ between them helped a lot.

Turns out, GitHub has a very handy feature that lets you search through code and filter it by language: 

![](http://i.imgur.com/xpra6SN.png)

For example, [here's the search results](https://github.com/search?utf8=%E2%9C%93&q=Stream+resource+language%3AElixir&type=Code&ref=searchresults) for `Stream.resource/3`.

There are a few interesting examples. Here are two of my favourites:

1. [ExTwitter](https://github.com/parroty/extwitter/blob/88096589f774e9b087a62766580ac3605a1dff4e/lib/extwitter/api/streaming.ex) is a wonderful example to see how Elixir Streams work with Twitter's Streaming API.

2. [DirWalker](https://github.com/pragdave/dir_walker/blob/0aa035c2a4ce457694cd8a82c350e9084b5f9d04/lib/dir_walker.ex) by Dave Thomas is a file-system directory tree walker that can handle large filesystems by traversing the directory tree lazily.

Thanks for reading! <3!

