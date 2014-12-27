---
title: "Pattern #1: Template Method"
date: 2013-05-29 10:04
comments: true
tags: ["Ruby", "Design Patterns", "Template Method"]
---

This is one of the simplest design patterns. The GoF book has the most concise description of the __Template Method__:

> Define the _skeleton of an algorithm_ in an operation, deferring some steps to subclasses. 
> 
> Template Method lets _subclasses redefine certain steps of an algorithm without changing the algorithms's structure_.

First, notice the use of "__subclasses__" and it should be obvious that this pattern makes use of inheritance heavily.

Let's tease apart the description. 

###Define the _skeleton of an algorithm_ in an operation, deferring some steps to subclasses

Chances are, if you're doing any amount of Java, you probably have used the template method.

Here, we are extending the [AbstractList](http://docs.oracle.com/javase/6/docs/api/java/util/AbstractList.html) class. `AbstractList` already gives us most of the implementation to build a `List` that is supported by an array-like data store. 

```java
import java.util.AbstractList;

public class SuperAwesomeList extends AbstractList {
    @Override
    public Object get(int i) {
        return null;
    }

    @Override
    public int size() {
        return 0;
    }
}
```

Now, the programmer can use her creative genius to implement `get(i)` and `size()`.

###Template Method lets _subclasses redefine certain steps of an algorithm without changing the algorithms's structure_.

Here's another flavor of the Template Method in Ruby:
[Sidekiq](http://mperham.github.io/sidekiq/) is a message processor for Ruby. 

It is mostly used for pushing long-running jobs into the background (e.g.: sending emails, complex calculations, etc.)

Here, we have `HardWorker`, who's sole purpose is to crawl Wikipedia. We would like to put this in the background. Happily, to create a background worker using Sidekiq is almost trivial:

```ruby
class HardWorker
  include Sidekiq::Worker

  def perform(url)
    crawler = Crawler.new(url)
    crawler.crawl 
  end
end

# Run our worker!
HardWorker.perform_async('http://www.wikipedia.com')
```

The secret sauce is on line 2. Roughly, when you call `perform_async`, the __job processor__ is notified, which then runs the `perform` method of the worker.
 
Here's the condensed code snippet of the job processor calling the `perform` method of the worker:

```ruby
# Lots of code removed.
module Sidekiq
  class Processor
    def process
      ##########################
      # Lots of complicated code
      ##########################

      Sidekiq.server_middleware.invoke(worker, msg, queue) do
        worker.perform(msg) # <- Workers implement this anyway they like!
      end
      
      ##########################
      # Even more Ruby magic …
      ##########################
    end
  end
end
```

Now would be a good time to introduce ...

###The Hollywood Principle - Don't call us, we'll call you

![](/images/template_hollywood.png)

Look at the `process` method of `Sidekiq::Processor` again. 

Every worker _must_ include the `Sidekiq::Worker` module and _must_ implement `perform` method. 

The template method embodies the Hollywood principle nicely:

`Sidekiq::Processor` _doesn't care_ how any of the workers' `perform` method works - It just calls it. 

Every `Sidekiq::Worker` class implements its own unique `perform` method. This allows for flexibility without messing with the main algorithm of the `process` method.

###Keypoints: When to use the Template Pattern?

* you want to control the amount of subclassing (First example)
* the behavior of your algorithm varies, and subclasses are required to provide their own implementation (Second Example)
* you want only specific points where the algorithm should vary (Second Example)

The next pattern I would like to cover is the __Strategy Pattern__, a close cousin of the Template pattern.

Thanks for reading!

###References

Olsen, R. (2008) Design patterns in Ruby. Upper Saddle River, NJ: Addison-Wesley, p.59-76.

Gamma, E. (1995) Design patterns. Reading, Mass.: Addison-Wesley, p.325-330.


