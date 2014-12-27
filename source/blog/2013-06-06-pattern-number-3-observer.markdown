---
title: "Pattern #3: Observer"
date: 2013-06-06 22:58
comments: true
tags: ["Ruby", "Design Patterns", "Observer"]
---

Today, we'll look at one of the most useful patterns - The __Observer__. 

This is what the GoF have to say about the Observer:

> Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

We shall use the UML diagram to help us understand the pattern:

![](/images/observer_uml.png %})
(Credits: http://www.wikipedia.com/)

###The Subject

We begin with the __Subject__. This is the object that we are interested in when it's state changes. 

__Subject__ has an `observerCollection` field. As it's name suggests, this is typically a list collection (Array, List, etc). This stores a collection of __Observer__s which we will take a look next.

###The Observer

The parent __Observer__ defines one method - `notify()`. Classes which inherit the __Observer__ (`ConcreteObserverA`, `ConcreteObserverB`) are expected to implement `notify()`.

###PUB/SUB

This pattern is also known as the Publisher/Subscriber, or PUB/SUB for short.

![](/images/pubsub.jpeg)

Let's find out why:

###Subscribing and Unsubscribing

If the `Subject` needs to inform certain `Observer`s, then it calls the `registerObserver(observer)`. Similarly, once it can choose to remove any `Observer` by calling `unregisterObserver(observer)`.

###Publishing

Here's where the fun starts. Let's see some code that implements the UML diagram above:

```ruby
class Subject
  def initialize
    @observers = []
  end
  
  def notify_observers
    @observers.each do |observer|
      observer.notify
    end
  end
  
  def register_observer(observer)
    @observers << observer
  end
  
  def unregister_observer(observer)
    @observers.delete(observer)
  end
end
```

Then the Observer:

```ruby
class ObserverOne
  def notify
    puts "Observer 1 called."
  end
end

class ObserverTwo
  def notify
    puts "Observer 2 called."
  end
end
```

Then we add our observers:

```ruby
subject = Subject.new
subject.register_observer(ObserverOne.new)
subject.register_observer(ObserverTwo.new)
```

Now, whenever `Subject`'s state changes, it just has to call `notify_observers`:

```ruby
class Subject 
  # …  
  def change_variable
    # …
    notify_observers
  end
end
```

###Key Takeaways

The Observer pattern great for reducing the coupling between different components when these components need to be informed about changes. 

By separating the `Subject` and the `Observer`, we have a clean separation of concerns.

###Examples of Observer in use

[Ruby](http://rubyonrails.org/) has is very own `Observable` module, so there's really no need to implement one your own. See the [documentation](http://www.ruby-doc.org/stdlib-2.0/libdoc/observer/rdoc/Observable.html). Notice that the methods implemented are pretty similar.

[Rails](http://rubyonrails.org/) makes use of observers heavily. Here's a typical example:

```ruby
class User < ActiveRecord::Base
  after_create :send_email
  
  def send_email
    #send a welcome email
  end
end
```

Thanks for reading!

###References

Olsen, R. (2008) Design patterns in Ruby. Upper Saddle River, NJ: Addison-Wesley, p.95-110.

Gamma, E. (1995) Design patterns. Reading, Mass.: Addison-Wesley, p.293-303.







