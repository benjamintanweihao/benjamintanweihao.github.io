---
title: Battling the Dreaded Black Screen in VNC
date: 2019-09-23 15:55 UTC
tags: ["VNC", "Ubuntu", "Linux"]
---

VNC is an awesome tool. It's super fast (of course, in a local network!), and gets the job done when a plain terminal doesn't cut it. 

However, there's nothing more irritating then seeing the dreaded black or grey VNC screen:

![](https://i.stack.imgur.com/mfAVO.png)

It is such a productivity suck  and pain in the ass to deal with. I've had to deal with this for more than one occasion so I'm finally writing all the troubleshooting steps so that future me will thank current me.

These steps were tried on Tiger VNC on Ubuntu, but I suspect they would apply to Tight VNC and the like.

These are some steps that might help you to escape the VNC void.

### 1: Kill all existing VNC servers first

First do a `vncserver -list`

```
% vncserver -kill :0 # or whatever number was listed before
```

### 2: Do not use `sudo` to launch `vncserver`

Firstly, do not use `sudo` to launch `vncserver`. This creates files in the wrong permissions that would mess up non-`sudo` sessions.
* Kill all other VNC servers first

### 3. Check file permissions of `~/.Xauthority`

Check permissions are set to `$USER` for the following files:

* `~/.Xauthority`
* `~/.ICEauthority`

### 4. Is `$USER` logged in anywhere else?

Check that `$USER` is not logged in with the GUI. 


### 5. Check `~/.vnc/xstartup`

The following `~/.vnc/xstartup` works. Find one which is known to work for your system. 

```
#!/bin/sh

unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
OS=`uname -s`
if [ $OS = 'Linux' ]; then
  case "$WINDOWMANAGER" in
    *gnome*)
      if [ -e /etc/SuSE-release ]; then
        PATH=$PATH:/opt/gnome/bin
        export PATH
      fi
      ;;
  esac
fi
if [ -x /etc/X11/xinit/xinitrc ]; then
  exec /etc/X11/xinit/xinitrc
fi
if [ -f /etc/X11/xinit/xinitrc ]; then
  exec sh /etc/X11/xinit/xinitrc
fi
[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources
xsetroot -solid grey
xterm -geometry 80x24+10+10 -ls -title "$VNCDESKTOP Desktop" &
twm &
```

### 6. Check `~/.xsession-error` for clues

This is my favorite and by far the most useful tip. 

Whenever there's something wrong with the X Window system, it gets logged into this `~/.xsession-error`.

Below are some of the example error messages that helped with troubleshooting:

* `xfce4-session: Unable to access file /home/benjamintan/.ICEauthority: Permission denied`
* `/usr/bin/x-session-manager: X server already running on display :2 xfce4-session: Another session manager is already running`

## Good Luck! 

Hopefully, you'll never have to encounter any VNC problems, but if you stumble upon then, I hope this is of some use to you.

