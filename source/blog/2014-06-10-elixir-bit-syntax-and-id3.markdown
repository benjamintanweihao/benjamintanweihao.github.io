---
title: "Elixir Bit Syntax and ID3"
date: 2014-06-10 08:09
comments: true
tags: Elixir, Bit Syntax, MP3, KIϟϟ 
---

Bits and bytes have always confused me for some reason or another. I then came across [Bit Syntax Example: Decoding TCP Segments](http://books.google.com.sg/books?id=Qr_WuvfTSpEC&pg=PA206&lpg=PA206&dq=francesco+erlang+bit+syntax&source=bl&ots=aMSEdBvWHc&sig=ttdgZVovJVZmAccSnJIE1Q2snEg&hl=en&sa=X&ei=TmCWU7DnIsKcugShoYKYCA&ved=0CCkQ6AEwAQ#v=onepage&q&f=false) in Erlang Programming (by Francesco Cesarini and Simon Thompson) and decided that bit syntax was something too cool to ignore.

I was searching for a nice example to showcase, then stumbled upon [Erlang Bit Syntax and ID3](http://citizen428.net/blog/2010/09/04/erlang-bit-syntax-and-id3). Therefore, I humbly present my Elixir version.

## MP3 and ID3

ID3 is described as a metadata container that is most commonly used in MP3s:

![](/images/vlc_metadata.png)

## The Task

We will write a small program to extract information such as the title and  artist information. Before we get into coding, we must acquaint ourselves with the _layout_ of the ID3 tag.

## The Layout

Here is the layout of a MP3 file:

![](http://id3.org/ID3v1?action=AttachFile&do=get&target=id3v1_blocks.gif)

The green portion represents the audio data, which we _don't care_ about. The important part is the _last 128 bytes_ (the _orange_ portion), that contains the ID3v1 tag information. 

The ID3v1 tag layout is as follows:

![](/images/id3v1.png)

Note that the _length_ column are all in bytes.

## Implementation

### Step 1: Reading from a file

```elixir
defmodule ID3Parser do
 
  def parse(file_name) do
    case File.read(file_name) do
      {:ok, binary} ->
        IO.inspect binary
        # ...
      _ -> 
        IO.puts "Couldn't open #{file_name}"
    end
  end
  
end
 
ID3Parser.parse("sample.mp3")
```

Here's I'm assuming that `id3_parser.ex` is in the same directory as `sample.mp3`. Running this program gives:

```
% elixir id3_parser.ex
<<73, 68, 51, 4, 0, 0, 0, 1, 95, 118, 78, 67, 79, 78, 0, 1, 81, 52, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 5, 0, 4, 0, 4, 0, 4, 0, 4, 0, 16, 0, 79, 0, 114, 3, 41, 47, 25, 62, 56, 38, ...>>
```

`File.read/1` returns `{:ok, binary}`, where binary is a binary data object that contains the
contents of path, or `{:error, reason}` if an error occurs. Here, we make use of pattern matching to match on `{:ok, binary}`, and treat everything else as an error.

### Step 2: Extracting the ID3 Tag

Recall that the ID3 tag is the _last_ 128 bytes of the MP3. Therefore, we need to calculate the size of the entire MP3 file. Using `binary` that we pattern matched earlier, finding the size of only the audio portion (in bytes) is simple:

```elixir
mp3_byte_size = (byte_size(binary) - 128)
```

Here comes some bit syntax awesomeness. Since we know the size of the audio part, we can use this information to just extract the ID3 portion:

```elixir
<< _ :: binary-size(mp3_byte_size), id3_tag :: binary >> = binary
```

First, notice the `=`: We are pattern matching on `binary` to _destructure_ the binary based on the _size_ of the  bytes. Also, notice that the pattern is wrapped around `<<>>`.

In the first half of the pattern, we match the _audio_ portion of the MP3 file. We don't care about the audio part, hence we use the `_` operator. 

```elixir
<< _ :: binary-size(mp3_byte_size), ... >>
```

On the other hand, we _do care_ about the ID3 part of the file, which is matched by `id3_tag` in the second half of the pattern.

```elixir
<< ... , id3_tag :: binary >>
```

The only difference with this and the previous pattern is that we are omitting the size.

Note that you __cannot__ do this:

```elixir
<< _ :: binary, id3_tag :: binary-size(128) >> = binary
```

That is, we cannot specify the size at the _end_ of the binary. Otherwise, we get a nice error message:

```
% elixir id3_parser.ex
id3_parser.ex:6: warning: variable mp3_byte_size is unused
** (CompileError) id3_parser.ex:7: a binary field without size is only allowed at the end of a binary pattern
    (stdlib) lists.erl:1336: :lists.foreach/2
    id3_parser.ex:1: (file)
    (elixir) src/elixir_lexical.erl:17: :elixir_lexical.run/2
    (elixir) lib/code.ex:303: Code.require_file/2
```

If you have been following, here's how `id3_parser.ex` should look like now:

```elixir
defmodule ID3Parser do
 
  def parse(file_name) do
    case File.read(file_name) do
      {:ok, binary} ->

        mp3_byte_size = (byte_size(binary) - 128)
        << _ :: binary-size(mp3_byte_size, id3_tag :: binary >> = binary
 
      _ -> 
        IO.puts "Couldn't open #{file_name}"
    end
  end
  
end
 
ID3Parser.parse("sample.mp3")
```

Go ahead and run the file for a sanity check. The compiler will complain that `id3_tag` is not used. We will remedy that in step 3.

### Step 3: Extracting Metadata from ID3

Here is the layout of a MP3 file again:

![](/images/id3v1.png)

The main thing to realize is that the _fields_ in the layout are _fixed_. Without further ado, here's the code: 

```elixir
<< "TAG",
    title   :: binary-size(30), 
    artist  :: binary-size(30), 
    album   :: binary-size(30), 
    year    :: binary-size(4), 
    comment :: binary-size(30), 
    _rest   :: binary >> = id3_tag
```

Beautiful, isn't it? This is almost a 1-to-1 _description_ of the layout in the table above. First, we pattern match on `"TAG"`. Since each character is a byte each, we don't need to specify the size. The rest of the fields use the same pattern matching techniques we have seen earlier.

And, we are done!

### Full Source Code

Here's the entire source:

```elixir
defmodule ID3Parser do

  def parse(file_name) do
    case File.read(file_name) do
      {:ok, binary} ->
        mp3_byte_size = (byte_size(binary) - 128)
        << _ :: binary-size(mp3_byte_size), id3_tag :: binary >> = binary

        << "TAG",
            title   :: binary-size(30), 
            artist  :: binary-size(30), 
            album   :: binary-size(30), 
            year    :: binary-size(4), 
            comment :: binary-size(30), 
            _rest   :: binary >> = id3_tag

        IO.puts title
        IO.puts artist 
        IO.puts album 
        IO.puts year 
        IO.puts comment 

      _ -> 
        IO.puts "Couldn't open #{file_name}"
    end
  end

end

ID3Parser.parse("sample.mp3")
```

Running this on an MP3 would give:

```
% elixir id3_parser.ex                                                         
I Was Made For Loving You
KISS
Dynasty
1979
Best wedding entrance song!
```

### Step 4: Listen to some awesome KIϟϟ:

![](/images/kiss.jpg)

[Do, do, do, do, do, do, do, do, do Do, do, do, do, do, do, do Do, do, do, do, do, do, do, do, do Do ...](http://www.youtube.com/watch?v=u7isxoTIeYM)
