---
title: "Pattern #4: Adapter"
date: 2013-06-11 23:43
comments: true
tags: ["Ruby", "Design Patterns", "Adapter"]
---

![](/images/adapter.jpg)

The __Adapter__ pattern is one of those patterns that requires little imagination to figure out what they do. 

First off, let's see the definition courtesy of GoF:

> Convert the interface of a class into another interface clients expect.
> 
> Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.

Let's see some code:

```ruby
class Client
  def initialize(target)
    @target = adapter
  end
  
  def do_work
    # do hard work …
    @target.complex_operation
    # ...
  end
end

class Target
  def complex_operation
    # la la la ...
  end
end
```

Here's the story:

Normally the `Client` would be expecting that the `target` be able to `do_work` without a hitch:

```ruby
client = Client.new(Target.new)
client.do_work
```

One fine day, your boss comes over, and shows you this class, and tells you that `SomeOtherTarget` must work with `Client`:

```ruby
class SomeOtherTarget
  def trivial_operation
    # oh no! different method name…
  end
end
```

Obviously, this won't work, because `SomeOtherTarget` does not have the `complex_operation` method that the `Client` expects:

```ruby
client = Client.new(SomeOtherTarget.new)
client.do_work # DOES NOT WORK
```

##Plugging in the Adapter

We need some way to bridge this difference in interfaces. How do we somehow connect `Client`'s expectation of a `complex_operation` method with `SomeOtherTarget`'s `trivial_operation` ?

Here's the `Adapter` class to the rescue:

```ruby
class Adapter 
  def initialize(adaptee)
    @adaptee = adaptee
  end
  
  def complex_operation
    @adaptee.trivial_operation
  end
end
```

And with this bit of indirection, `Client` can happily use `SomeOtherTarget`:

```ruby
client = Client.new(Adapter.new(SomeOtherTarget.new))
client.do_work # DOES NOT WORK
```

Notice how now the `Adapter` object takes the place of the `@target` instance variable of `Client`. The `Adapter` object now becomes the middleman/wrapper/translator. This is composition at work!

##2 Flavors of Adapters: Object & Class

Now, if you check out the [Wikipedia entry](http://en.wikipedia.org/wiki/Adapter_pattern) you will see the 2 kinds of Adapters - __Class__ and __Object__ adapters.

###Object Adapter

![](/images/object_adapter.png)
(Credits: Wikipedia)

###Class Adapter

![](/images/class_adapter.png)
(Credits: Wikipedia)

###So what's the difference?

I don't know about you, but when I first saw both UML diagrams, my eyes glazed. The key here to to focus on the differences.

The __Object Adapter__ uses _composition_. Notice that the `Adapter` has an `+adaptee` field. The `Adapter` class has to use the `Adaptee` class, and that's essentially [_composition_](http://en.wikipedia.org/wiki/Composition_over_inheritance).

The __Class Adapter__ uses _multiple inheritance_ (that's the hollow triangular arrows pointing upwards). Frankly, I don't know too much about multiple inheritance, and in general, unless you're a C++ programmer (I'm sorry), you probably won't need this.

Conclusion: Stick to the Object Adapter.

In the next post, I will look at the __Proxy__ pattern. Thanks for reading! 

###References

Olsen, R. (2008) Design patterns in Ruby. Upper Saddle River, NJ: Addison-Wesley, p.163-174.

