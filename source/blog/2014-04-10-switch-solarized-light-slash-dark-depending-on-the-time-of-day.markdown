---
title: "Switch between Solarized Light/Dark in vim Automagically"
date: 2014-04-10 13:17
comments: true
tags: vim, solarized
---

I stare _way_ too long at the screen – I guess we all do. I have my monitor contrast and brightness turned down pretty low, and use software like [f.lux](https://justgetflux.com/) to automatically adjust my computer screen. 

Above all, I absolutely love [Solarized](http://ethanschoonover.com/solarized). Everytime I switch to some other theme, I find myself coming back to Solarized.

Solarized comes in 2 flavours, light and dark. For those who have no idea what I'm talking about, here's some eye candy:

## Solarized Light

![](http://ethanschoonover.com/solarized/img/solarized-fontsamples-light.png)

## Solarized Dark

![](http://ethanschoonover.com/solarized/img/solarized-fontsamples-dark.png)

(Source: [http://ethanschoonover.com/solarized](http://ethanschoonover.com/solarized))

So here's the thing. I was wondering if it is possible to automatically switch between Solarized (Dark|Light) based on the time of day. 

During the _day_, I want it _dark_. At _night_, I want the _light_ version.

Just put this little piece of awesomeness in your `.vimrc`:

```
let hour = strftime("%H")
if 6 <= hour && hour < 18
  set background=light
else
  set background=dark
endif

colorscheme solarized
```

So when it is between than 6 a.m. and 5 p.m (`hour` is an integer), Solarized Light is activated. Otherwise, Solarized Dark. 

Hope you found this useful!
