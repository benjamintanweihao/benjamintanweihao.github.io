---
title: How Does Symbol#to_proc Work?
date: 2015-03-16 10:15 UTC
tags: Ruby, Closures, Book
---

_This is an excerpt from my book, [The Ruby Closures Book](https://leanpub.com/therubyclosuresbook). If you like it, consider [buying](https://leanpub.com/therubyclosuresbook) it! <3_

`Symbol#to_proc` is one of the finest examples of the flexibility and beauty of Ruby. This syntax sugar allows us to take a statement such as

```ruby
words.map { |s| s.length }
```

and turn it into

```ruby
words.map &:length
```

Let's unravel this syntactical sleight of hand, by figuring out how this works.

## What does the &:symbol do?

How does Ruby even know that it has to call a `to_proc` method, and why is this only specific to the `Symbol` class? 

When Ruby sees an `&` and an object – _any_ object – __it will try to turn it into a block__. This is simply form of type coercion. 

Take `to_s` for example. We can do `2.to_s`, which returns the string representation of the integer '2'. Similarly, `to_proc` will attempt to turn an object – again, _any_ object – into a proc.

## Reimplementing Symbol#to_proc

Let's see what this means. Let's create an object, and plop it into `each`:

```ruby
obj = Object.new => #<Object:0x007ff4218761b8>
[1,2,3].map &obj 
TypeError: wrong argument type Object (expected Proc)
```
	
That's awesome! Our error message is telling us exactly what we need to know: it's saying that `obj` is well, an _Object_ and not a `Proc`. The fix is simple: the `Object` class must have a `to_proc` method that _returns a proc_. Let's do the simplest thing possible:

```ruby
class Object
  def to_proc
    proc {}
  end
end

some_obj = Object.new
[1, 2, 3].map &obj #=> [nil, nil, nil]
```

Now when we run this again, we get no errors. Almost there! How can we then access each element, and say, print it? We need to let out `proc` accept a parameter:

```ruby
class Object
  def to_proc
    proc { |x| "Here's #{x}!" }
  end
end

some_obj = Object.new
[1,2,3].map &obj #=> ["Here's 1!", "Here's 2!", "Here's 3!"]
```

This hints at a possible implementation of `Symbol#to_proc`. Let's start with what we know, and _redefine_ `to_proc`:

```ruby
class Symbol
  def to_proc
    proc { |obj| obj }
  end
end
```

We know that in an expression such as

```ruby
words.map &:length
```

is equivalent to

```ruby
words.map { |w| w.length }
```

Here, the symbol _instance_ is `:length`. This _value_ of the symbol corresponds to the _name_ of the method. We have previous found out how to access each yielded object – by making the proc return value in `to_proc` take in an argument.

We want to achieve this effect:

```ruby
class Symbol
  def to_proc
    proc { |obj| obj.length }
  end
end
```

How can we use the name of the symbol to call a method on `obj`? `send` to the rescue! I hereby present you our own implementation of `Symbol#to_proc`:

```ruby
class Symbol
  def to_proc
    proc { |obj| obj.send(self) }
  end
end
```

Here, `self` is the symbol object (`:length` in our example), which is exactly what `#send` expects.

<iframe width="160" height="400" src="https://leanpub.com/therubyclosuresbook/embed" frameborder="0" allowtransparency="true" style="float: left; margin-top: 40px; margin-right: 20px;"></iframe>


## Improving on our Symbol#to_proc 

Our initial implementation of `Symbol#to_proc` is naïve. The reason is that we only consider the `obj` in the body of the `proc`, and totally ignore its arguments. 

Recall that unlike lambdas, procs are more relaxed when it comes to the number of arguments it is given. We can therefore easily expose this limitation. 

First, we return a lambda instead of a proc in `to_proc`. Recall that a lambda is a proc, so everything should work as per normal: 

```ruby
class Symbol
  def to_proc
    lambda { |obj| obj.send(self) }
  end
end
	
words = %w(underwear should be worn on the inside)
words.map &:length # => [9, 6, 2, 4, 2, 3, 6]
```

Since we know lambdas are picky when it comes to the number of arguments, is there a method that requires _two_ arguments? Of course: `inject/reduce`. The usual way of writing `reduce` is:

```ruby
[1, 2, 3].inject(0) { |result, element| result + element } # => 6
```

As you can see, the block in inject takes in two arguments. Let's see how our implementation does, by using the `&:symbol` notation:
	
```ruby
[1, 2, 3].inject(&:+)
```

Here's the error we get:

```ruby
ArgumentError: wrong number of arguments (2 for 1)
from (irb):10:in `block in to_proc'
from (irb):14:in `each'
from (irb):14:in `inject'
...
```
	
We can now clearly see that we are missing an argument. The lambda currently accepts only 1 argument, but what it received was 2 arguments. We need to allow the lambda to take in arguments:

```ruby
class Symbol
  def to_proc
    lambda { |obj, args| obj.send(self, *args) }
  end
end

[1, 2, 3].inject(&:+) # => 6
```

Now it works as expected! We use the splat operator (that's the "*" in `*args`) to support a variable number of arguments. We have one problem though. This doesn't work anymore:

```ruby	
words = %w(underwear should be worn on the inside)
words.map &:length # => [9, 6, 2, 4, 2, 3, 6]

ArgumentError: wrong number of arguments (1 for 2)
from (irb):3:in `block in to_proc'
from (irb):8:in `map'
...
```

There are two ways to fix this. First, we can give `args` a default value:

```ruby
class Symbol
  def to_proc
    lambda { |obj, args=nil| obj.send(self, *args) }
  end
end

words = %w(underwear should be worn on the inside)
words.map &:length # => [9, 6, 2, 4, 2, 3, 6]

[1, 2, 3].inject(&:+) # => 6
```

Or, we can just make it a `Proc` again:

```ruby
class Symbol
  def to_proc
    proc { |obj, args| obj.send(self, *args) }
  end
end

words = %w(underwear should be worn on the inside)
words.map &:length # => [9, 6, 2, 4, 2, 3, 6]

[1, 2, 3].inject(&:+) # => 6
```

This is one of the rare cases when being less picky about arity helps.

## Thanks for Reading! 

Hope you learned something – I sure did when putting together the [book](https://leanpub.com/therubyclosuresbook).

