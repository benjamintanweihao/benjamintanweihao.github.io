---
title: "Connecting Elixir nodes on the same LAN"
date: 2014-05-25 18:01
comments: true
tags: ["Elixir", "Distribution", "Nodes"]
---

We've all heard that Erlang (and therefore Elixir) is brilliant for building distributed applications. I even did a [post](/blog/2013/07/13/elixir-for-the-lazy-impatient-and-busy-part-4-processes-101/) that had a small distributed Elixir section (see: A Sneak Peek into Distributed Elixir). 

## A Quick Refresher on Connecting Nodes

In that post, I showed how easy it was to connect nodes together in Elixir. Here's a quick refresher. Open 2 terminal windows. 

In the first window:

```
% iex --sname one
Erlang/OTP 17 [erts-6.0] [source-07b8f44] [64-bit] [smp:2:2] [async-threads:10] [hipe] [kernel-poll:false] [dtrace]

Interactive Elixir (0.13.1-dev) - press Ctrl+C to exit (type h() ENTER for help)
iex(one@benjamintan)1>
```

In the second window:

```
% iex --sname two
Erlang/OTP 17 [erts-6.0] [source-07b8f44] [64-bit] [smp:2:2] [async-threads:10] [hipe] [kernel-poll:false] [dtrace]

Interactive Elixir (0.13.1-dev) - press Ctrl+C to exit (type h() ENTER for help)
iex(two@benjamintan)1>
```

Here, we use the _short name_ (`--sname`) flag to start the 2 nodes. At this point, the nodes cannot see each other yet. Let's change that.

In this example, I will pick the second terminal session (`iex(two@benjamintan)`):

```
iex(two@benjamintan)1> Node.connect :'one@benjamintan'
true
```

Success! You can see the connected node(s) using `Node.list/0`. If you run this function on `one@benjamintan`, you get:

```
iex(one@benjamintan)1> Node.list
[:two@benjamintan]
```

Note that it only shows the nodes connected _except_ itself. If you wanted an entire list of connected nodes, you could do this:

```
iex(one@benjamintan)2> [node|Node.list]
[:one@benjamintan, :two@benjamintan]
```

## What about Connecting Nodes via LAN?

This was the exact question I was asking myself today. Unfortunately, my Google-fu was not strong, so I had to resort to good old trial-and-error. 

I had written a simple distributed application, and wondered if I could test it on 2 separate machines instead of simply opening 2 `iex` sessions. Obviously, I knew this could be done, but I had to prove to myself that it worked.

Turns out, it wasn't _that_ complicated (nothing really is once you got things figured out). If you have 2 machines with Elixir (or Erlang) installed, and you haven't done this before, I encourage you to try this out.

### Step 1: Find out the IP Addresses of both machines

First, we need to find out the IP addresses of both machines. On Linux/Unix systems, that's usually `ifconfig`. Also, do make sure that they both are connected to the same LAN.

So here's an example output on one of my machines:

```
% ifconfig
lo0: flags=8049<UP,LOOPBACK,RUNNING,MULTICAST> mtu 16384
  options=3<RXCSUM,TXCSUM>
  inet6 ::1 prefixlen 128
  inet 127.0.0.1 netmask 0xff000000
  inet6 fe80::1%lo0 prefixlen 64 scopeid 0x1
  nd6 options=1<PERFORMNUD>
gif0: flags=8010<POINTOPOINT,MULTICAST> mtu 1280
stf0: flags=0<> mtu 1280
en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST> mtu 1500
  ether 10:93:e9:05:19:da
  inet6 fe80::1293:e9ff:fe05:19da%en0 prefixlen 64 scopeid 0x4
  inet 192.168.0.103 netmask 0xffffff00 broadcast 192.168.0.255
  nd6 options=1<PERFORMNUD>
  media: autoselect
  status: active
```

In this case, the IP address I'm interested in is `192.168.0.103`. On the other machine, the IP address is `192.168.0.100`. 

### Step 2: Connecting both Nodes together

Alright, let's give this a go. On the first machine, start `iex` but this time with the long name (`--name`) flag. Also, append `@<ip-address>` after the name.

```
% iex --name one@192.168.0.100
Erlang/OTP 17 [erts-6.0] [source-07b8f44] [64-bit] [smp:2:2] [async-threads:10] [hipe] [kernel-poll:false] [dtrace]

Interactive Elixir (0.13.1-dev) - press Ctrl+C to exit (type h() ENTER for help)
iex(one@192.168.0.100)1>
```

Do the same on the second machine:

```
% iex --name two@192.168.0.103
Erlang/OTP 17 [erts-6.0] [source-07b8f44] [64-bit] [smp:2:2] [async-threads:10] [hipe] [kernel-poll:false] [dtrace]

Interactive Elixir (0.13.1-dev) - press Ctrl+C to exit (type h() ENTER for help)
iex(two@192.168.0.103)1>
```

With that, let's connect `one@192.168.0.100` to `two@192.168.0.103`: 

```
iex(one@192.168.0.100)1> Node.connect :'two@192.168.0.103'
false
```

Wait what? On `two@192.168.0.103`, you would be able to see a similar error report:

```
=ERROR REPORT==== 25-May-2014::22:32:25 ===
** Connection attempt from disallowed node 'one@192.168.0.100' **
```

#### Remember the Cookie!

When you connect nodes on the same machine AND you do not set any cookie with the `--cookie` flag, the Erlang VM simply uses the generated one that sits in your home directory:

```
% cat ~/.erlang.cookie
XBYWEVWSNBAROAXWPTZX%
```

This means that if you connect nodes _without_ the cookie flag on the _same_ local machine, you usually will not hit into any problems. 

On different machines however, this is a problem, since the cookies are likely to be different (unless you copied them over by hand). So, let's restart the entire process, except this time, we a cookie value:

On the first machine:

```
% iex --name one@192.168.0.100 --cookie monster
Erlang/OTP 17 [erts-6.0] [source-07b8f44] [64-bit] [smp:2:2] [async-threads:10] [hipe] [kernel-poll:false] [dtrace]

Interactive Elixir (0.13.1-dev) - press Ctrl+C to exit (type h() ENTER for help)
iex(one@192.168.0.100)1>
```

On the second machine, we make sure we use the _same_ cookie value:

```
% iex --name two@192.168.0.103 --cookie monster
Erlang/OTP 17 [erts-6.0] [source-07b8f44] [64-bit] [smp:2:2] [async-threads:10] [hipe] [kernel-poll:false] [dtrace]

Interactive Elixir (0.13.1-dev) - press Ctrl+C to exit (type h() ENTER for help)
iex(two@192.168.0.103)1>
```

Let's connect `one@192.168.0.100` to `two@192.168.0.103` again: 

```
iex(one@192.168.0.100)1> Node.connect :'two@192.168.0.103'
true
iex(one@192.168.0.100)2> Node.list
[:"two@192.168.0.103"]
```

Hurray! You have successfully set up an Elixir cluster in your LAN. Instead of typing the full IP address, you could always add an entry to `/etc/hosts`, but I'm too lazy for that.

### Step 3: Write a Distributed Map-Reduce in Elixir ...

![](/images/mapreduce.jpg)

... or not.

Thanks for reading!









