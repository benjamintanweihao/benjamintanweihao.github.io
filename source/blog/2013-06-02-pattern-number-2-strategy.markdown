---
title: "Pattern #2: Strategy"
date: 2013-06-02 13:48
comments: true
tags: ["Ruby", "Design Patterns", "Strategy"]
---

![](/images/delegate.png)
(Credits: http://www.indigoexcel.com/)

__Strategy__ is a simple, yet powerful, design pattern to have in your toolbox. It's main power comes from its clever use of delegation. Here's the GoF definition:

> Define a family of algorithms, encapsulate each one, and make them interchangeable. 
> Strategy lets the algorithm vary independently from client that use it.

Let's assume the following:

You have just written an backup utility that is beloved by sysadmins all over the world.

So far, your most requested feature is to support multiple forms of notifications. Currently, the user is only notified via standard output (i.e. Log file).

You want to support multiple notifications, but yet, you are too _busy/lazy_ to support the multitudes of notification methods (e.g.: Twitter/IRC/XMPP/etc).

So how? Here's where __Strategy__ comes to the rescue.

In this example, there are 3 classes:

1. `Context`: Think of this as the client class. This is the class that is going to make use of the pattern. In the previous example, this could be the `BackupUtility` class.

2. `EmailNotifier`/`TwitterNotifier`: These classes represent the different notifiers we want to use.

```ruby
class Context
  def initialize(notifier)
    @notifier = notifier
  end

  def notify(message)
    @notifier.notify(message)
  end
end

class EmailNotifier
  def initialize(opts)
    @user_name   = opts[:user_name]
    @password    = opts[:password]
  end

  def notify(message)
    GoogleMailer.new.send(message)  
  end
end

class TwitterNotifier
  def initialize(opts)
    @handle = opts[:handle]
  end

  def notify(message)
    Twitter::Client.new.tweet("#{message} #{@handle}")  
  end
end
```

So now, if we want to send notifications via email:

```ruby
context = Context.new(EmailNotifier.new(username: 'ben@gmail.com', password: 'secretlol'))
context.notify('Backup completed successfully!')
```
And if we want Twitter notifications instead:

```ruby
context.notifier = TwitterNotifier.new(handle: '@bentanweihao')
context.notify('Catastrophic disaster! Prepare for a long night.')
```

Now, the beautiful thing about the Strategy is that anyone can write custom notifications. 

All the implementation has to do is to implement the `notify` method, and then set the `notifier` attribute of the `Context` class to the new notifier.

##Delegate, Delegate, Delegate

Delegation is at the heart of the strategy pattern. Most of its magic derives from the deceptively simple `notify` method in the `Context` class:

```ruby
def notify(message)
	@notifier.notify(message)
end
```

The `Context` class doesn't care how the `notifier` is implemented. It just calls the `notify` method with the correct set of parameters.

##Open/Close Principle

__Strategy__ is an example of the [Open/Closed principle](http://en.wikipedia.org/wiki/Open/closed_principle).

The essence of it is:

> Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.

Imagine for a moment that our `Context` class is compiled and distributed only in binary form. No one else can modify the code except (closed of modification) yourself. How can you then allow others to create extensions to your code? 

If you have understood __Strategy__, this would be a non-issue since you just have to implement the correct interface, assign the correct attributes and you'll be all set.

##Strategy vs. Template Method

* Unlike __Template method__, __Strategy__ doesn't require inheritance. 

* __Template method__ modifies _part_ of the algorithm, while __Strategy__ swaps out the entire algorithm with a new one.

In the next post, I'll cover an extremely useful and common pattern - __Observer__.

Thanks for reading!

###References

Olsen, R. (2008) Design patterns in Ruby. Upper Saddle River, NJ: Addison-Wesley, p.77-93.

Gamma, E. (1995) Design patterns. Reading, Mass.: Addison-Wesley, p.315-323.


