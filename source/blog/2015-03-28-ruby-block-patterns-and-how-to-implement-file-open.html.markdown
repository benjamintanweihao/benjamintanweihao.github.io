---
title: Ruby Block Patterns and How to Implement File.open
date: 2015-03-28 03:42 UTC
tags: Ruby, Closures, Book
---

_This is an excerpt from my latest book, [The Ruby Closures Book](https://leanpub.com/therubyclosuresbook). If you like it, consider [buying](https://leanpub.com/therubyclosuresbook) it! <3_

##  Managing Resources with Blocks

Blocks are an excellent way to abstract pre and post processing. A wonderful example is how resource management is managed. Examples include opening and closing file handlers, socket connections, database connections etc.

In other languages (C and Java, I'm looking at you), remembering to open and close the resource is a largely manual affair. This is both painful and ugly:

```ruby
f = File.open('Leo Tolstoy - War and Peace.txt', 'w')
f << "Well, Prince, so Genoa and Lucca" 
f << " are now just family estates of the Buonapartes."
f.close
```

If you omit `f.close`, the file will remain open until the script terminates. In other words, you get a _resource leak_. If you have a long running application like a daemon or web application, then this is bad news. That's because the operating system can only handle a finite number of file handles. If you the long running daemon continuously opens files and doesn't close them, soon enough the file handles run out, and you'll get a 3 a.m. call. Happy times.

If you think about it, what we really want is to _write_ to the file. Having to remember to _close_ the file handle is a hassle. 

Ruby has a very elegant way of doing this:

```ruby
File.open('Leo Tolstoy - War and Peace.txt', 'w') do |f|
  f << "Well, Prince, so Genoa and Lucca" 
  f << " are now just family estates of the Buonapartes."
end
```

By passing in a block into `File.open`, Ruby helps you, the over-burdened (and downright lazy) developer, to close the file handle when you are done writing the program. Notice that the file handle is nicely scoped _within_ the block.

<iframe width="160" height="400" src="https://leanpub.com/therubyclosuresbook/embed" frameborder="0" allowtransparency="true" style="float: right; margin-top: 40px; margin-left: 20px;"></iframe>


## Implementing File.open

How is this done? Let's learn to do this ourselves. First of all, the [Ruby documentation](http://ruby-doc.org/core-2.1.4/File.html#method-c-new) provides and excellent overview of `File.open`: 

> With no associated block, File.open is a synonym for ::new. If the optional code block is given, it will be passed the opened file as an argument and the File object will automatically be closed when the block terminates. The value of the block will be returned from File.open.
 
This tells us _everything_ we need to implement `File.open`:

a) If there's no block given, `File.open` is the same as `File.new`:

```ruby
class File
  def self.open(name, mode)
	  new(name, mode) unless block_given?
  end
end
```

b) If there's a block, the block is then passed the opened file as an argument ...

```ruby
class File
  def self.open(name, mode, &block)
    file = new(name, mode)
    return file unless block_given?
    yield(file)
  end
end
```

c) ... and the file is automatically closed when the block terminates

```ruby
class File
  def self.open(name, mode, &block)
    file = new(name, mode)
    return file unless block_given?
    yield(file)
    file.close
  end
end
```

There's a subtlety to this. What happens if an exception is raised in the block? `file.close` will not be called! Thankfully, that's an easy fix with the `ensure` keyword:

```ruby
class File
  def self.open(name, mode, &block)
    file = new(name, mode)
    return file unless block_given?
    yield(file)
  ensure
    file.close
  end
end
```

Now, `file.close` is _always_ guaranteed to close properly.

d) The value of the block will be returned from File.open.

Since `yield(file)` is the last line, the value of the block will be returned from File.open.

![](http://i.imgur.com/Gh5M6wm.jpg)

_In the [book](https://leanpub.com/therubyclosuresbook), I placed little exercises at the end of sections that let you test your understanding of the concepts that were just presented. Solutions are also included!_

## Exercises

1. _Implement File.open_. Start off with the Ruby Documentation on `File.open`. The key here is to understand where to put pre and post processing code, where to put `yield`, and ensuring that resources are cleared up.

2. _Real-world Ruby code Ruby Redis Library_: Here is some code adapted from the [Ruby Redis library](https://github.com/redis/redis-rb/blob/7c4a95413009cefa0c74d8d320f1ae90a1c953c2/test/support/redis_mock.rb):

```ruby
module Redis
  class Server
    # ... more code ...

    def run
      loop do
        session = @server.accept

        begin
          return if yield(session) == :exit
        ensure
          session.close
        end
      end
    rescue => ex
      $stderr.puts "Error running server: #{ex.message}"
      $stderr.puts ex.backtrace
    ensure
      @server.close
    end

    # ... more code ...
  end
end
```

Notice the similarities to the `File.open` example. Does `run` require a block to be passed in? How is the return result of the block used? How could this code be called? 

## Solutions

1. Your final code should look something like this:

```ruby
class File
  def self.open(name, mode, &block)
    file = new(name, mode)
    return file unless block_given?
    yield(file)
  ensure
    file.close
  end
end
```

2. Let's go through the answers in order:

a) Does `run` require a block to be passed in?

Yes. There is no `block_given?`, and `yield` is called without any conditionals.

b) How is the return result of the block used? 

The return result of the block is compared with `:exit`.

c) How could this code be called? 

The key here is that the block passed has exactly one argument:

```ruby
Server.new.run do |session|
  # do something with session
end
```

## Thanks for Reading! 

Hope you learned something! For more block patterns and other fun learnings, do check out the [book](https://leanpub.com/therubyclosuresbook) that I put together.

