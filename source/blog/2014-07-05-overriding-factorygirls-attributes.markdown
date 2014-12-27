---
title: "Overriding, Modifying and Decorating FactoryGirl's attributes"
date: 2014-07-05 11:21
comments: true
tags: Ruby, Testing, FactoryGirl, Spree
---

I was pairing with [Zi](https://twitter.com/hungryzi) at work today, and we hit onto an interesting problem.

## The Problem

We were working on a [Spree](http://spreecommerce.com/) application, which is a really nice Rails engine/gem e-commerce platform. Out of the box, it contains a bunch of factories. Here's the default `user_factory.rb` in Spree:

```ruby
FactoryGirl.define do
  sequence :user_authentication_token do |n|
    "xxxx#{Time.now.to_i}#{rand(1000)}#{n}xxxxxxxxxxxxx"
  end

  factory :user, class: Spree.user_class do
    email { generate(:random_email) }
    login { email }
    password 'secret'
    password_confirmation { password }
    authentication_token { generate(:user_authentication_token) } if Spree.user_class.attribute_method? :authentication_token

    factory :admin_user do
      spree_roles { [Spree::Role.find_by(name: 'admin') || create(:role, name: 'admin')] }
    end

    factory :user_with_addreses do
      ship_address
      bill_address
    end
  end
end
```

Now, our Rails application which uses Spree has an _extra_ attribute `username`. We _could_ have use [traits](http://robots.thoughtbot.com/remove-duplication-with-factorygirls-traits), and create a new factory like `:user_with_username`. The _tiny_ problem with that is the original `:user` factory is used __EVERYWHERE__.

One terrifying solution would have been to crack open the Spree gem and make the modification there. My suggestion was quickly dismissed.

We tried something like this:

```ruby
FactoryGirl.define do
  sequence :user_name do |n|
    "user_name_{rand(1000)}#{n}"
  end

  factory :user, class: Spree.user_class do
    user_name { generate(:user_name) }
  end
end
```

Unfortunately, this only throws a `DuplicateDefinitionError: :user already registered: user` exception.

We tried _unregistering_ a factory, especially since there's a `Factory.register`, but again no luck. We tried _deleting_ a factory, and we were left depressed.

## The Solution

The solution wasn't complicated. Finding it on Google and StackOverflow was. This explains the post's title.

There are essentially 2 steps to this solution.

### Step 1: Make sure Spree's factories are loaded first.

In `spec_helper.rb`, you need to add `require 'spree/testing_support/factories` in order to use Spree's built-in factories. Make sure this is included __before__ the your custom factories. 

That's because you are going to _modify_ Spree's factories, so you need to make sure that the Spree one gets loaded first.

### Step 2: Modify the Factory

I never knew `Factory.modify` existed:

```ruby
Factory.define do
  sequence :user_name do |n|
    "user_name_{rand(1000)}#{n}"
  end
end

Factory.modify do
  factory :user do
    user_name { generate(:user_name) }
  end
end
```

Note that the `sequence :user_name` has to go into it's own `Factory.define` block. Therefore, this __doesn't work__:

```ruby
Factory.modify do
  sequence :user_name do |n|
    "user_name_{rand(1000)}#{n}"
  end

  factory :user do
    user_name { generate(:user_name) }
  end
end
```

## That's it!

We saw green again, and prevented anyone of us from getting bald. Hope this saves someone a couple of hours work.

Thanks for reading!

