---
title: "Elixir for the Lazy, Impatient and Busy: Part 1 |> Lists and Recursion"
date: 2013-06-13 23:39
comments: true
tags: ["Elixir", "Lists", "Recursion"]
---

Welcome to the first of (hopefully) many series of _Elixir for the Lazy, Impatient and Busy_! 

As you might know, I'm [adopting Elixir as my next language](/blog/2013/06/08/why-my-next-programming-language-is-elixir/). The following series of blog posts are going to cover the interesting aspects of Elixir as I learn about it.

##You are Lazy, Impatient and Busy

> The three chief virtues of a programmer are: Laziness, Impatience and Hubris.
> - Larry Wall

Before I begin, I'm going to assume the following:

1) You don't have a lot of time on your hands. You don't want to buy a book just to see what Elixir looks like, but yet you are still interested to learn about this awesome programming language.

2) You know how to code.		

3) You know how to look up [documentation](http://elixir-lang.org/docs/stable/) on your own and how to [install](http://elixir-lang.org/getting_started/introduction.html) Elixir.

There is probably going to be a lot of hand-waving, but I'm going to assume that you can probably infer from the context, and make parallels with whatever programming language you are comfortable with. 

In cases where there are glaring differences, I would highlight it.

I would encourage you to try out the examples and if you have any better implementations than the one I've shown, please share them via the comments!

That said, let's dive right into Lists and Recursion.

***

I'll run through a couple of functions selected from Elixir's [Enum API](http://elixir-lang.org/docs/stable/Enum.html), and we shall implement our "poor man's" version of the following (This means that you will not want to use this for your production code, but I believe it provides enough learning value to get your brain juice flowing.): 

1. `empty?/1`
2. `count/1`
3. `first/1`

Notice the `/1`? That's the _arity_ of the function - The number of parameters the function will take. 

Today, the examples that we go through will lead up to implementing our very own `flatten/1` function. Here's how it would work:

```elixir
List.flatten [1, [:a, 3], [[4], :b]]
# Returns:
[1,:a,3,4,:b]
```

Couple of things to notice: 

1. Lists can contain more lists - List-ception.
2. List need not be homogeneous. `:a` are atoms, something like symbols in Ruby.

##Pattern matching

Elixir has some very sweet pattern matching capabilities. The most important thing to know about lists is probably this:

>A non-empty list consists of a head and a tail. The tail is also a list.

![](/images/listmonster.png)
(Credits: http://learnyouahaskell.com/)

##Implementing empty?

`empty?/1` returns true if a list is empty, false otherwise:

```elixir
defmodule MyList do
  def empty?([]), do: true
  def empty?(list) when is_list(list) do
    false
  end
end

IO.puts MyList.empty? [1, 2, 3] # Returns false
IO.puts MyList.empty? []        # Returns true
```

Things to notice:

1. `defmodule` defines a module. Calling the function defined in the module would therefore be `IO.puts MyList.empty? [1, 2, 3]`.

2. There are 2 definitions of `empty?`. This is where the pattern matching comes in. A non-empty list like `[1, 2, 3]` will _fail to match_ the first definition, but would match the second one. An empty list `[]` will match the first definition and its function body will execute.

3. There are 2 different ways to write the function body. One liners have `, do:`. The other flavor is the `do … end` block.

4. `when` is a __guard clause__. Think of it like a conditional for now. In this example, we make use of `is_list(list)` to make sure that only lists are accepted as the parameter. 

So what happens if none of the parameters match?

```elixir
iex(11)> MyList.empty? :you_mad_bro?
** (UndefinedFunctionError) undefined function: MyList.empty?/1
    MyList.empty?(:you_mad_bro?)
```

Elixir complains, because it cannot find a match.

##Implementing first/1

`first` gives us the first element of a (obviously) non-empty list.  

```elixir
defmodule MyList do
  def first([ head | tail ]), do: head
end

IO.puts MyList.first([ 1 ])            # Returns 1
IO.puts MyList.first([ 3, 1, 2, 5, 1]) # Returns 3
```

Why does it match `[1]`? `[1]` is made of the head `1`, and the empty list. Therefore, an alternative representation is `[ 1 | [] ]`.

Note: Notice that the variable `tail` is not used. In fact, Elixir will complain with `variable tail is unused`. Replace `tail` with `_tail` and we'll be good. This tells Elixir to ignore the variable.

##Implementing count/1

`count` gives us a peek into how recursion works in Elixir:

```elixir
defmodule MyList do
  def count([]), do: 0
  def count([ head | tail ]) do
    1 + count(tail)
  end  
end

IO.puts MyList.count([]) 
IO.puts MyList.count([1])
IO.puts MyList.count([3, 1, 2, 5, 1])
```

Here, we're making use of the pattern matching once again.

1. `[]` matches the first definition, and returns 0 immediately.
2. A non-empty list would match the second definition.

Let's see how the `[ head | tail ]` helps us out by tracing the recursive steps:

```elixir
Call count [3, 1, 2, 5, 1]: head = 3, tail = [1, 2, 5, 1]
➥ 1 + count [1, 2, 5, 1]
  Call count [1, 2, 5, 1]: head = 1, tail = [2, 5, 1]
  ➥ 1 + 1 + count [2, 5, 1]
    Call count [2, 5, 1]: head = 2, tail = [5, 1]
    ➥ 1 + 1 + 1 + count [5, 1]
      Call count [5, 1]: head = 5, tail = [1]
      ➥ 1 + 1 + 1 + count [5, 1] 
        Call count [1]: head = 1, tail = []
        ➥ 1 + 1 + 1 + 1 + count [1]
          Call count []: 
          ➥ 1 + 1 + 1 + 1 + 1 + count []
          ➥ 1 + 1 + 1 + 1 + 1 + 0
```          

##Now the fun begins: Implementing flatten/1

`flatten` should take a list of arbitrarily nested elements such that the resulting elements are all non-lists. The only other thing you'll need is the `++` operator, which concatenates 2 lists together.

Here's my implementation of `flatten/1`, which I'll readily admit took me quite a while to figure out:
 
```elixir
defmodule MyList do
  def flatten([]), do: []

  def flatten([ head | tail ]) do 
    flatten(head) ++ flatten(tail)
  end

  def flatten(head), do: [ head ]
end

IO.inspect MyList.flatten([ [1], [ 2, [3] ] , [4]]) # Returns [1,2,3,4]
IO.inspect MyList.flatten([ [], [ [], [3] ] , [4]]) # Returns [3,4]
```

See if you can reason this for yourself. :)

Thanks for reading!











