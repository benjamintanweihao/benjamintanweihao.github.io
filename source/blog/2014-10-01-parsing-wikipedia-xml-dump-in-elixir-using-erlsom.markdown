---
title: "Parsing the Wikipedia XML dump in Elixir using Erlsom (or, Big Data in Elixir)"
date: 2014-10-01 17:22
comments: true
tags:  ['Elixir', 'Erlang', 'Erlsom', 'Wikipedia', 'XML']
---

Seems like I'm the last person to learn about SAX, which stands for (Simple API for XML). I wanted a nice example for my [book](http://www.exotpbook.com), and one of the things I wanted to do was to parse Wikipedia. Turns out, Wikipedia provides XML dumps, which comes in at a hefty 10GB, compressed. Uncompressed, the single XML file weighs in at 50GB. Look Ma, I'm doing Big Data<sup>TM</sup>!

## Why SAX?

It is practically impossible to load the entire XML file into memory. This means that parsers that work by loading the entire DOM is out of the question. SAX parsers, on the other hand, work by reading the XML file sequentially, and fires off events when say, it encounters the start/end of an element.

## The State of XML Parsing in Erlang/Elixir

I think Erlangers do not do a lot of XML parsing, judging by the lack of (readable) documentation. The official Erlsom documentation is an exception though, and that is what we are going to use.

## Getting SAXy with Wikipedia

We are going to learn how to parse a __huge__ XML using Erlsom's SAX parser. If you are unfamiliar with SAX, you will get a slightly better idea by the end of this article. You will also gain a greater appreciation of how Elixir's pattern matching leads to a more declarative programming style – that is, expressing what you want, compared to _how_ to do it.

To follow along, you would need to download one of the Wikipedia dump from [here](http://meta.wikimedia.org/wiki/Data_dump_torrents).

### Creating a Project

I'm using Elixir v1.0.0, and so should you. Go ahead and create a project, and give it a kick-ass name:

```
% mix new saxy
* creating README.md
* creating .gitignore
* creating mix.exs
* creating config
* creating config/config.exs
* creating lib
* creating lib/saxy.ex
* creating test
* creating test/test_helper.exs
* creating test/saxy_test.exs

Your mix project was created successfully.
You can use mix to compile it, test it, and more:

    cd saxy
    mix test

Run `mix help` for more commands.
```

Next, we need to pull in the Erlsom library. Open up `mix.exs`, and add the necessary lines in `deps`:

```elixir
defmodule Saxy.Mixfile do
  use Mix.Project

  def project do
    [app: :saxy,
     version: "0.0.1",
     elixir: "~> 1.0.0-rc2",
     deps: deps]
  end

  def application do
    [applications: [:logger]]
  end

  defp deps do
    [
      {:erlsom, git: "git@github.com:willemdj/erlsom.git"} 
    ]
  end
end
```

Then, do a `mix deps.get` in the project directory to pull in all the necessary dependencies.

### Parsing XML using Erlsom 

On to the fun stuff. The meat of the application revolves around `:erlsom.parse_sax/4`:

```erlang
parse_sax(XML, Acc0, EventFun, Options) -> {ok, AccOut, Rest}

Xml      = [int()], a list of Unicode code points
Acc0     = a term() that is passed to the EventFun.
Eventfun = a fun() that is called by the parser whenever it has parsed a bit of the Xml input 
Options  = [Option]
Option   = {continuation_function, CState, CFunction} 
AccOut   = a the result of the last invocation of EventFun. 
Rest     = list of characters that follow after the end of the XML document
```

The above is directy copied from the [documentation](https://github.com/willemdj/erlsom/blob/master/doc/reference.md#parse_sax), which means that the above code is in Erlang.

Here's our application in full (this is located in `lib/saxy.ex`). You can also take a moment to get a rough idea of how the `:erlsom.parse_sax/4` function is used.

```elixir
defmodule Saxy do
  defmodule SaxState do
    defstruct title: "", text: "", element_acc: ""
  end

  @chunk 10000 

  def run(path) do
    {:ok, handle} = File.open(path, [:binary])

    position           = 0
    c_state            = {handle, position, @chunk}

    :erlsom.parse_sax("", 
                      nil, 
                      &sax_event_handler/2, 
                      [{:continuation_function, &continue_file/2, c_state}])

    :ok = File.close(handle)
  end

  def continue_file(tail, {handle, offset, chunk}) do
    case :file.pread(handle, offset, chunk) do
      {:ok, data} ->
        {<<tail :: binary, data::binary>>, {handle, offset + chunk, chunk}}
      :oef ->
        {tail, {handle, offset, chunk}}
    end
  end

  def sax_event_handler({:startElement, _, 'title', _, _}, _state) do
    %SaxState{}
  end

  def sax_event_handler({:startElement, _, 'text', _, _}, state) do
    %{state | element_acc: ""}
  end

  def sax_event_handler({:characters, value}, %SaxState{element_acc: element_acc} = state) do
    %{state | element_acc: element_acc <> to_string(value)}
  end

  def sax_event_handler({:endElement, _, 'title', _}, state) do
    %{state | title: state.element_acc}
  end

  def sax_event_handler({:endElement, _, 'text', _}, state) do
    state = %{state | text: state.element_acc}
    IO.puts "Title: #{state.title}"
    IO.puts "Text:  #{state.text}"
    state
  end

  def sax_event_handler(:endDocument, state), do: state
  def sax_event_handler(_, state), do: state

end
```

### Taking it apart

Let's take the program apart. We start with `run/1`.

```elixir
def run(path) do
  {:ok, handle} = File.open(path, [:binary])

  position           = 0
  c_state            = {handle, position, @chunk}

  :erlsom.parse_sax("", 
                    nil, 
                    &sax_event_handler/2, 
                    [{:continuation_function, &continue_file/2, c_state}])

  :ok = File.close(handle)
end
```

We open the XML file in `:binary` mode. What is returned a tuple containing the `:ok` atom and a _file handle_. We are not reading the entire file here. You will see exactly how we do that later on.

The first argument is an empty string, which is basically what you start off with. The second argument we will not use.

#### Continuation Function

Let's ignore the third argument for now, and concentrate on the last one:

```elixir
[{:continuation_function, &continue_file/2, c_state}]
```

This tells `:erlsom.parse_sax/4` to use a __continuation function__. The continuation function is called each time when `:erl.parse_sax/4` needs more data. More data would be needed when `:erl.parse_sax/4` is done parsing the current chunk of file – that was provided by the  _previous_ invocation of the continuation function.

Notice how we refer to the `continue_file` function using the `&` and `/arity` syntax. `c_state` is the tuple that we pass into `continue_file`. This tuple contains the XML file `handle`, the `position` of the file we are going to read from, and finally the `@chunk`, which is how much of the file we read each time.

Let's take a look at the implementation of `continue_file`:

```elixir
def continue_file(tail, {handle, offset, chunk}) do
  case :file.pread(handle, offset, chunk) do
    {:ok, data} ->
      {<<tail :: binary, data::binary>>, {handle, offset + chunk, chunk}}
    :oef ->
      {tail, {handle, offset, chunk}}
  end
end
```

The second argument is `c_state`. This information is used in `:file.pread`, which allows us to read files in `chunks` given an `offset`. 

So what's `tail`? It is a list of characters that the SAX parser couldn't parse during the previous invocation, which could be due to an incomplete token, or some encoding issues. Either way, we will join back the `tail` with whatever current data we were reading from.

Assuming we have more data (`:file.pread/3` returns `{:ok, data}`, then we return a tuple containing the updated data (the `tail` concatenated with the `data` read from file), and an updated `c_state`, whose offset value has incremented with the chunk size.

If we hit the end of the file, `:eof` will be pattern matched and we return a tuple containing the `tail` and the unchanged `c_state`.

It's worth taking a step back and review what we have just learnt. The `continuation_function` provides a way to read the file in chunks. It also handles incomplete data by combining the previous un-parseable data with the current chunk of data being read.

Yay, we're done with the hard part.

#### SAX Events

Now, we can look into how we can parse the ginormous XML file.

As a refresher, this is our favorite `:erl.parse_sax/4` again:

```elixir
:erlsom.parse_sax("", 
                  nil, 
                  &sax_event_handler/2, 
                  [{:continuation_function, &continue_file/2, c_state}])
```

The third argument defines the function to call when SAX events are triggered. An example of a SAX event is `startElement` and `endDocument`.

Here are all the events:

```elixir
defmodule Saxy do
  defmodule SaxState do
    defstruct title: "", text: "", element_acc: ""
  end

  # Omitted stuff ...

  def sax_event_handler({:startElement, _, 'title', _, _}, _state) do
    %SaxState{}
  end

  def sax_event_handler({:startElement, _, 'text', _, _}, state) do
    %{state | element_acc: ""}
  end

  def sax_event_handler({:characters, value}, %SaxState{element_acc: element_acc} = state) do
    %{state | element_acc: element_acc <> to_string(value)}
  end

  def sax_event_handler({:endElement, _, 'title', _}, state) do
    %{state | title: state.element_acc}
  end

  def sax_event_handler({:endElement, _, 'text', _}, state) do
    state = %{state | text: state.element_acc}
    IO.puts "Title: #{state.title}"
    IO.puts "Text:  #{state.text}"
    state
  end

  def sax_event_handler(:endDocument, state), do: state
  def sax_event_handler(_, state), do: state
end
```

Notice how pattern matching comes into play here. We only need to say what kind of tags we are interested in. One look and you can tell only tags that are `<title>...</title>` and `<text>...</text>` are of interest to us.

All of the `sax_event_handler`s return a `SaxState`, which is a `defstruct` with 3 pieces of information. Let's see how these information is populated. The structure of the Wikipedia XML is as such:

```xml
<mediawiki xml:lang="en">
  <page>
    <title>Page title</title>
    <revision>
      <text>A bunch of [[text]] here.</text>
    </revision>
    <revision>
      <text>An earlier [[revision]].</text>
    </revision>
  </page>
  <page>
    <title>Talk:Page title</title>
    <revision>
      <text>WHYD YOU LOCK PAGE??!!! i was editing that jerk</text>
    </revision>
  </page>
</mediawiki>
```

I have taken the liberty to remove tags that we don't care about.

So let's imagine you are a parser, and you only care about _contents_ `<title>...</title>` and `<text>...</text>`. Along the way, you hit into the first `<title>` opening tag. A SAX event is triggered, and only one matches:

```elixir
def sax_event_handler({:startElement, _, 'title', _, _}, _state) do
  %SaxState{}
end
```

Here, we only have to initialize a brand new `SaxState`. After the initial title tag, everything that follows _before_ the closing `</title>` tag is well, the title. The event that is triggered is: 

```elixir
def sax_event_handler({:characters, value}, %SaxState{element_acc: element_acc} = state) do
  %{state | element_acc: element_acc <> to_string(value)}
end
```

Here, we are _accumulating_ all the data that is being triggered by this event and storing the contents into `element_acc` of the `SaxState`. Notice that we are not explicitly saying that this has to be inside a `<title>` or `<text>`, as this function is pretty generic.

At a certain point, you would encounter the _closing_ tag of `</title`>. No surprise, another SAX event triggers:

```elixir
def sax_event_handler({:endElement, _, 'title', _}, state) do
  %{state | title: state.element_acc}
end
```

Here, we return a _new_ state containing all the `element_acc` that we have accumulated before, and set that as the title. In case you are unfamiliar with the funky syntax, that is just the way `defstruct` and Maps is updated. (Note, a _new_ state is returned, since Elixir's data structures are immutable.)

So that's that for `<title>...<title>`. Sooner or later, you encounter `<text>`. This time, return a new state, making sure that `element_acc` is an empty string. Again, this is needed because the `sax_event_handler` that handles the `{:characters, value}` event doesn't know which tag we are currently in, and will happily accumulate `element_acc` unless told otherwise.

```elixir
def sax_event_handler({:startElement, _, 'text', _, _}, state) do
  %{state | element_acc: ""}
end
```

Finally, once we have hit the closing tag of `</text>`, we do the same as before and store `element_acc`, but this time in `text`:

```elixir
def sax_event_handler({:endElement, _, 'text', _}, state) do
  state = %{state | text: state.element_acc}
  IO.puts "Title: #{state.title}"
  IO.puts "Text:  #{state.text}"
  state
end
```

That's pretty much it! The remaining 2 event handlers are pretty self explanatory. The last one is just a "catch-all":

```elixir
def sax_event_handler(:endDocument, state), do: state
def sax_event_handler(_, state), do: state
```

## Running the project

To run it, from the project folder:

```
% iex -S mix
iex> Saxy.run "path_to_wiki/wiki.xml"
```

You will see Wikipedia fly by, without getting any out of memory problems. 

## Parting Thoughts

Hopefully I've made some positive contribution to the dearth of information out there. I plan to do more interesting things with Wikipedia, especially since I've got this XML parsing thing figured out. I had a lot of fun putting this together, and if you are interested, the repository is at [GitHub](https://github.com/benjamintanweihao/saxy).

Being able to use Erlang libraries directly from Elixir is so, so nice.

Special thanks to [Jesper](https://github.com/jlouis) for helping me figure some of this stuff out.

Thanks for reading, you are awesome! <3!

