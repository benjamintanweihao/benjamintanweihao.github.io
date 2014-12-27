---
title: "Elixir for the Lazy Impatient and Busy: Part 5 Streams, Streaming and Dynamo!"
date: 2013-08-14 22:32
comments: true
tags: ['Elixir', 'Streaming', 'Streams', 'Dynamo'] 
---

It's been a while since my last post. Work has been crazy, and I was busy reading all about Erlang, a little bit of Clojure, and an even tinier bit of Haskell. Enough excuses though, let's get right to it!

Today, we will be taking a first dip into [Dynamo](https://github.com/elixir-lang/dynamo), the web framework powered by Elixir. We will be building something fun along the way, to demonstrate what are [_Streams_](http://elixir-lang.org/blog/2013/07/13/elixir-v0-10-0-released/) and _Streaming_.

The inspiration largely comes from Miguel Camba's [post](http://miguelcamba.com/blog/2013/04/29/tutorial-build-a-web-app-using-elixir-and-dynamo-with-streaming-and-concurrency/).

##Introducing Squigglies

The application you are going to build today will show you the awesomeness of server side events (SSE) and its trivial implementation in Dynamo. 

![](/images/squigglies.jpg)

(Credits: [Flickr](http://www.flickr.com/photos/audioscience/4021599374/in/photostream/))

In particular, the application will:

* be absolutely pointless
* be a waste of CPU cycles
* be fun

You, on the other hand, will:

* create your first Dynamo application
* deploy it to Heroku
* create a cool demo to show off to your friends

##Getting Started with Dynamo

Assuming you already have Elixir installed, and too lazy to read the excellent installation [instructions](https://github.com/elixir-lang/dynamo#installation), here goes:

Fire up your terminal. I am assuming everything is done on the home directory.

1. `cd`

2. `git@github.com:elixir-lang/dynamo.git`

3. `cd dynamo`

4. `MIX_ENV=test mix do deps.get, test`

5. `mix dynamo ~/squigglies`

6. `cd squigglies`

7. `mix deps.get`

8. `mix server`

9. Fire up your browser and point it to `http://localhost:4000`

##Streams != Streaming

Before I go on any further, let me clarify that Streams are not the same as Streaming. They are completely different concepts altogether. 

##Lazy Streams are Lazy

Streams are nothing new actually. Clojure, Haskell, OCaml all have them. In order not to feel left out, Elixir v0.10.0 was released with support for [Streams](http://elixir-lang.org/blog/2013/07/13/elixir-v0-10-0-released/). 

A stream is _possibly_ an infinite list. Reading a file can be represented as a stream:

```elixir
File.stream!('james-joyce-ulysses.txt')
```

Reading a file obviously isn't infinite. On the other hand ...

```elixir
Stream.cycle([1, 2, 3]) 
```
... __does not__ return an infinite list of [1, 2, 3, 1, 2, 3, ........]. Instead, what you get is a `#Function<2.28375021 in Stream.cycle/1>`. To get anything out of this list, you need to `take/2` it:

```elixir
iex(2)> Stream.cycle([1,2,3]) |> Stream.take(10) |> Enum.to_list
[1, 2, 3, 1, 2, 3, 1, 2, 3, 1]
```

The short story here is that Streams are lazy, meaning the computations are only performed at the very last moment. This is what makes the representation of infinite lists possible. 

So, I hope it won't take you much convincing to figure out why this is a _bad_, _bad_ idea:

```elixir
iex(1)> Stream.cycle([1,2,3]) |> Enum.to_list
```

Go on, try it. I dare you. I double dare you.

There are many other goodies covered in the [documentation](http://elixir-lang.org/docs/stable/Stream.html).

##Streaming

We are going to implement server-side streaming. For that to happen, our Dynamo project (that the official term, _project_, not application) will have to generate a response using the `text/event-stream` MIME type. 

In particular, our response needs to conform to the [Event stream format](https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events#Event_stream_format).

The short story is that we want our server to generate a bunch of data _continuously_. No refreshes, no Ajax callbacks.

##Back to Dynamo now!

*Side note: I've seen some people compare Dynamo to Rails. I really think it looks more like Sinatra. Also, I've been doing Rails for quite a while, so I was pleasantly surprised that a web framework could start up that quickly ... :X*

Head over to `squigglies/web/routers/application_router.ex`:

Let's go ahead and add a route called `/stream`:

```elixir
defmodule ApplicationRouter do
  use Dynamo.Router

  prepare do
    conn.fetch([:cookies, :params])
  end

  get "/" do
    conn = conn.assign(:title, "Welcome to Dynamo!")
    render conn, "index.html"
  end
  
  # Add this route
  get "/stream" do
  	conn.resp 200, "Row, row, row your boat …"
  end
end
```

Then navigate to `http://localhost:4000/stream` to confirm everything works OK.

##Implementing Streaming

Let's modify the route. In order to simulate streaming, we need something continuous to simulate an endless stream of data (see what I did there?). 

In our example, let's generate a bunch of random numbers:

```elixir
iex(1)> Stream.repeatedly(fn -> :random.uniform end) |> Enum.take(3)
[0.4435846174457203, 0.7230402056221108, 0.94581636451987]
```

Recall that in order to implement streaming, our server needs to package the response in a `text/event-stream` MIME type. Within the route block, add this:

```elixir
  get "/stream" do
  	conn = conn.resp_content_type("text/event-stream")
  	conn = conn.send_chunked(200)
  end
```

`send_chunked` spits out the response immediately. 

Notice that we keep reassigning the `conn` variable. Always remember that Elixir data structures are immutable. The connection (`conn`) is a data structure too. So the only way to capture the effect of the operation is to assign in to another variable. 

See [here](https://github.com/elixir-lang/dynamo#immutability) for more info.

Here comes the fun part! We want to keep outputting an endless stream of random numbers

```elixir
  get "/stream" do
    conn = conn.resp_content_type("text/event-stream")
    conn = conn.send_chunked(200)
    
    iterator = Stream.repeatedly(fn -> :random.uniform end)
    
    Enum.each iterator, fn(element) ->
      { :ok, conn } = conn.chunk "data: #{element}\n\n"
      await conn, 200, on_wake_up(&1, &2), on_time_out(&1)
    end
  end

  defp on_wake_up(_arg1, _arg2) do
    # Nothing
  end

  defp on_time_out(_arg1) do
    # Nothing
  end
```

Here's the breakdown:

1. `iterator` contains our lazy stream. 
2. Using `Enum.each`, we take one element, format it into `"data: #{element}\n\n` (that's the event stream format, among [others](https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events#Event_stream_format))
3. Sleep for 200ms, then start over.

Now, let's see what you have accomplished. Go right ahead to `http://localhost:4000/stream` and be mesmerized by an endless stream of random numbers. Yay!

##Getting this to work on the front-end

There's another piece of the puzzle that we have yet to figure out, and that is getting our data _read_.

Here are the absolute bare minimum Javascript to get started:

```javascript
<script>
// 'stream' is our URL as defined in the router.
var source = new EventSource('stream');
source.addEventListener('message', function(e) {
	// e.data contains the random numbers (without the "data: ")
	console.log(e.data);
}, false);
</script>
```

##What I've done

So, I've hooked up `/stream` to a [d3.js](http://www.d3js.org) graph. Here is how it looks like: 

![](/images/squigglies.png)

Here's the [live](http://mysterious-thicket-3554.herokuapp.com/) version and the [source](https://github.com/benjamintanweihao/squigglies).

##Deploying to Heroku

This was surprisingly easy. (Assuming you already have the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-command) installed, and you have pushed your project to git.) Here's the lazy man/woman version:

Go the the directory of your app, then:

1. `heroku create --buildpack "https://github.com/goshakkk/heroku-buildpack-elixir.git"`
2. `echo "OTP_R16B" > .preferred_otp_version`
3. `echo 'web: MIX_ENV=prod mix server -p $PORT' > Procfile`
4. `git add .`
5. `git commit -m "Setup for Heroku"`
6. `git push heroku master`

The last line would be the URL that you will use to spread the Elixir love <3.

##Next time …

I hope you enjoyed this tutorial, and maybe give you a little inspiration for interesting things to build with Dynamo. Do share in the comments any interesting ideas that you may have!

Thanks for reading!

