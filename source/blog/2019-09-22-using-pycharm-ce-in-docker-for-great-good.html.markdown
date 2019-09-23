---
title: Using PyCharm CE in Docker for Great Good!
date: 2019-09-22 05:40 UTC
tags: ["Docker", "PyCharm"]
comments: true
---


I've been using Docker quite a bit recently and beginning to see what the fuss is all about. Since, then, I've been Dockerizing everything up, down, left, right and center (My blog, my personal learning projects, my kids...)

In this post, I'll demonstrate how to add PyCharm into an existing Python (or Java, C++, Elixir etc) project that relies on a Jet Brains IDE. This is essentially my workflow for non-trivial projects that require a full-fledged IDE. This is awesome because you can reap the benefits of a Dockerized project without sacrificing your favorite IDE. 

## The Problem

I have a non-trivial Python project that I've been coding in PyCharm (Community Edition) that has since been Dockerized. This is awesome, because there's quite a few non-trivial dependencies in there, some of which are quite time consuming to build. Additionally, some of the resources needs to be pulled from S3. This was getting very painful after having to set up the project in multiple computers.

With Docker, I just have to endure a couple of gigabytes worth of downloading, and I can start developing ... right?

Well, the problem is PyCharm _Community Edition_. 

You see, in order for PyCharm on the host to understand my Python project, it would have to use a _remote interpreter_, which is totally legit since technically I didn't have to install any dependencies -- everything that's ever needed for the project is packaged nicely in the Docker container.

You might think it's possible to mount and map a volume, but again I'm assuming that this is a completely fresh machine, or at least, without the project being set up before. 

However, the remote interpreter is a paid-feature. Also, it feels a bit iffy to set it up as a remote interpreter, since that just seems like another potential point of failure. 

## The (Cheapo) Solution

Turns out, the solution (in hindsight) is pretty obvious. If PyCharm cannot read the Dockerized project, then simply have a copy of PyCharm in the project!

## Prerequisites

There's a big caveat to this approach. I've only tested this on an _Ubuntu_ machine. 

* Ubuntu (I've tried 16.04 and 18.04)
* (Optional) PyCharm installed on the host

## The Scenario and Setup

So I've been learning me some [Apache Spark](https://spark.apache.org/) and [Apache Beam](https://beam.apache.org/), and of course I'm not going to pollute my beautiful machine with all the dependencies and deal with fiddly set-up instructions. 

It is not important to know what Spark and Apache Beam are, just that they are for data processing.

This is basically what I need:

* Spark 2.4.x
* Apache Beam
* PyCharm

### Dockerfile

The full [Dockerfile](https://gist.github.com/benjamintanweihao/29c85fcd598cc7ccab4c9b3baba3f96f) can be found here. Here's only the important bits:

```bash
# SYSTEM SETUP GOES HERE
...
# JAVA and PYTHON DEPENDENCIES GO HERE
...
# HADOOP DEPENDENCIES GO HERE
...
# SPARK DEPENDENCIES GO HERE
...

###### PYCHARM DEPENDENCIES #######

WORKDIR /opt/pycharm

ARG pycharm_source=https://download.jetbrains.com/python/pycharm-community-192.6603.24.tar.gz

RUN curl -fsSL $pycharm_source -o /opt/pycharm/installer.tgz \
  && tar --strip-components=1 -xzf installer.tgz \
  && rm installer.tgz \
  && /usr/bin/python2 /opt/pycharm/helpers/pydev/setup_cython.py build_ext --inplace \
  && /usr/bin/python3 /opt/pycharm/helpers/pydev/setup_cython.py build_ext --inplace

###### PYCHARM DEPENDENCIES #######

CMD ["bin/spark-class", "org.apache.spark.deploy.master.Master"]
```

Basically, the setup for PyCharm is left almost at the end of the the DockerFile, though it doesn't really matter. You can always change `pycharm_source` to point to any Jet Brains IDE you like, though you'll have to adjust the paths yourself. For example, if you're using Intellij then you shouldn't be using `/opt/pycharm`.

After the PyCharm dependencies are set up, the final command is meant to start the Spark server. In practice, this can be anything you want, or nothing at all.

### Building the Docker Image

This is the usual `docker build` (remember the dot at the end!):

```bash
% docker build -t benjamintanweihao/sparkdev .
```

### Running the Docker Container

Here comes the interesting bit:
 
 ```bash 
% docker run -it --rm --name sparkdev -e DISPLAY=${DISPLAY} -v `pwd`:/home/developer/ -v /tmp/.X11-unix:/tmp/.X11-unix -v ~/.PyCharmCE2019.2:/home/developer/.PyCharmCE2019.2 -p 4040:4040 benjamintanweihao/sparkdev
```

The most interesting flags that are related to PyCharm are:

* `-e DISPLAY=${DISPLAY}`
* `-v /tmp/.X11-unix:/tmp/.X11-unix`
* `-v ~/.PyCharmCE2019.2:/home/developer/.PyCharmCE2019.2` (Optional, but nice to have to match your local PyCharm settings and plugins)

The first two basically exposes your `xhost` so that the Docker container can render the display by reading and writing through the X11 socket. 

The final one maps the PyCharm settings directory. This is not strictly needed, but useful if you have plugins (like IdeaVim), themes, or any custom settings that you don't want to set manually. Note that you should adjust the version numbers according to the version you have installed on your own machine (the left part) and the Docker container (right part). 

Finally, note that in this case, the user account created in Docker image is `developer`, so be sure to adjust that too. 

Check out the full [Dockerfile](https://gist.github.com/benjamintanweihao/29c85fcd598cc7ccab4c9b3baba3f96f) for more details.

## Payoff!

Launching PyCharm from Docker is super simple:

```
% docker exec -it sparkdev /opt/pycharm/bin/pycharm.sh
```

Woot! Notice the cheerful _Welcome to PyCharm on \<Docker Container ID\>_.

![](https://i.imgur.com/URybli3.png)

I've been using this for my workflow for quite some time, and have been really pleased with it. I haven't noticed any performance issues. The only thing is the confusion that arises when I have a copy of Docker PyCharm and a local PyCharm opened at the same time, though that's purely an operator problem!

`vim` is forever.  🤘


