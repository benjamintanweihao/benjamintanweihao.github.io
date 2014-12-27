---
title: "The Phoenix Web Framework for Elixir and Websockets"
date: 2014-02-12 10:34
comments: true
tags: ["Elixir", "Phoenix", "Websockets"]
---

It has been a _really_ long while since my last Elixir post. I have been doing a lot of research and learning for my upcoming [book](http://www.exotpbook.com).

### Introducing Phoenix & Websockets example application

We're going to learn how to create an application that uses websockets. This is how it looks like:

![Websockets Example Application](http://i.imgur.com/Fjt3Q7y.png)

This is taken off [Cowboy's Websocket Example](https://github.com/extend/cowboy/tree/master/examples/websocket/). This example application demonstrates _bi-directional_ communication between the server (the phoenix application that you would be building later) and the client (your browser).

The source for the application can be found on [github](https://github.com/benjamintanweihao/so_much_websockets).

### Misadventures with Websockets

__Note:__ You can skip all the complaining and head to the next section, "Enter the Phoenix". You would however miss the effort it took for me to get a workable websockets example.

I needed websockets as part of the example application for the book. Unfortunately, I hit into several stumbling blocks. 

Here is a non-exhaustive list of the difficulties I ran into:

#### 1. Dynamo

This was the first web framework I turned to, since I spent the most time with. There is a [websocket example](https://github.com/dynamo/dynamo/blob/master/examples/websocket.exs) provided. 

Unfortunately, as I realized later, simply copying and pasting the code in a dynamo _project_ (that is, one created with `mix dynamo my_project`) wasn't going to cut it. 

Some helpful folks on `#elixir-lang` pointed out that I had to add some other settings. However by then I was to fed up to try any further. It took me too long to realise that a single file Dynamo (the one reflected in the examples) worked differently from a Dynamo _project_.

#### 2. Cowboy

This time, I tried to go _au naturel_, and tried using Cowboy. Playing with `:dispatch` was too much for me. Gave up after a couple of hours.

#### 3. Online Resources

Either my google-fu took a vacation, or there was a serious lack of documentation, or even source code examples. This obviously should not come as a surprise, but I was really grumpy for not being able to find any _working_ code.

### Enter the Phoenix

Enough complaining. Let's make sure we're on the same Elixir version:

```
% elixir -v                                                  
Elixir 0.12.4-dev
```

#### Installation

Head over to [https://github.com/phoenixframework/phoenix](https://github.com/phoenixframework/phoenix) and install Phoenix.

Or just copy paste:

```
git clone https://github.com/phoenixframework/phoenix.git
cd phoenix
mix do deps.get, compile
```

Now that you are in the `phoenix` directory, go ahead and create the example application:

__Note:__ Create the application _outside_ the `phoenix` directory.

I'll just create an app on my `~/Desktop`:

```
% mix phoenix.new  so_much_websockets ~/Desktop
```

Navigate to the `so_much_sockets` directory:

```
% cd ~/Desktop/so_much_sockets
```

Fetch the required dependencies:

```
% mix deps.get
```

#### Folder Structure

Whenever I play around with web frameworks, I like to see the folder structure, just to get a feel:

```
% tree                                                                               
.
├── README.md
├── lib
│   ├── so_much_websockets
│   │   ├── controllers
│   │   │   └── pages.ex
│   │   ├── router.ex
│   │   └── supervisor.ex
│   └── so_much_websockets.ex
├── mix.exs
└── test
    ├── so_much_websockets_test.exs
    └── test_helper.exs

4 directories, 8 files
```

At this point of writing, Phoenix has some slight incompatiblities with one of the dependencies. 

Open up `mix.exs` and have `deps/0` look like this:

```elixir
 defp deps do
   [
     { :phoenix, github: "chrismccord/phoenix" },
     { :plug, git: "https://github.com/elixir-lang/plug.git", tag: "v0.2.0", override: true },
   ]
end
```

After that, run `mix deps.get` again.

### Hello, Phoenix!

Let's run our app:

```
% iex -S mix 
iex(1)> SoMuchWebsockets.Router.start
Running Elixir.SoMuchWebsockets.Router with Cowboy with [port: 4000]
```

Then navigate to [http://localhost:4000](http://localhost:4000) to see the universal programmer greeting.

Give yourself a pat on the back.

### Where did our response come from?

#### 1. `router.ex`

Examine the router:

```elixir
defmodule SoMuchWebsockets.Router do
  use Phoenix.Router, port: 4000

  get "/", SoMuchWebsockets.Controllers.Pages, :index, as: :page
end
```

Should be self explantory. Not let's follow the trail and look at what's in 
`SoMuchWebsockets.Controllers.Pages`.

#### 2. `SoMuchWebsockets.Controllers.Pages`

```elixir
defmodule SoMuchWebsockets.Controllers.Pages do
  use Phoenix.Controller

  def index(conn) do
    text conn, "Hello world"
  end
end
```

Bingo! Let's replace `Hello world` with some html content. Because I'm extremely lazy, let's just do this:

```elixir
defmodule SoMuchWebsockets.Controllers.Pages do
  use Phoenix.Controller

  def index(conn) do
    html conn, """
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
        <title>Websocket client</title>
        <script src="/javascript/jquery.min.js"></script>
        <script type="text/javascript">
          
          var websocket;
          $(document).ready(init);
          
          function init() {
              if(!("WebSocket" in window)){  
                  $('#status').append('<p><span style="color: red;">websockets are not supported </span></p>');
                  $("#navigation").hide();  
              } else {
                  $('#status').append('<p><span style="color: green;">websockets are supported </span></p>');
                  connect();
              };
                  $("#connected").hide();   
                  $("#content").hide();   
          };

          function connect()
          {
              wsHost = $("#server").val()
              websocket = new WebSocket(wsHost);
              showScreen('<b>Connecting to: ' +  wsHost + '</b>'); 
              websocket.onopen = function(evt) { onOpen(evt) }; 
              websocket.onclose = function(evt) { onClose(evt) }; 
              websocket.onmessage = function(evt) { onMessage(evt) }; 
              websocket.onerror = function(evt) { onError(evt) }; 
          };  
          
          function disconnect() {
              websocket.close();
          }; 

          function toggle_connection(){
              if(websocket.readyState == websocket.OPEN){
                  disconnect();
              } else {
                  connect();
              };
          };

          function sendTxt() {
              if(websocket.readyState == websocket.OPEN){
                  txt = $("#send_txt").val();
                  websocket.send(txt);
                  showScreen('sending: ' + txt); 
              } else {
                  showScreen('websocket is not connected'); 
              };
          };

          function onOpen(evt) { 
              showScreen('<span style="color: green;">CONNECTED </span>'); 
              $("#connected").fadeIn('slow');
              $("#content").fadeIn('slow');
          };  

          function onClose(evt) { 
              showScreen('<span style="color: red;">DISCONNECTED </span>');
          };  

          function onMessage(evt) { 
              showScreen('<span style="color: blue;">RESPONSE: ' + evt.data+ '</span>'); 
          };  

          function onError(evt) {
              showScreen('<span style="color: red;">ERROR: ' + evt.data+ '</span>');
          };

          function showScreen(txt) { 
              $('#output').prepend('<p>' + txt + '</p>');
          };

          function clearScreen() 
          { 
              $('#output').html("");
          };
        </script>
      </head>

      <body>
        <div id="header">
          <h1>Websocket client</h1>
          <div id="status"></div>
        </div>


        <div id="navigation">

          <p id="connecting">
      <input type='text' id="server" value="ws://localhost:4000/ws"></input>
      <button type="button" onclick="toggle_connection()">connection</button>
          </p>
          <div id="connected">        
      <p>
        <input type='text' id="send_txt" value=></input>
        <button type="button" onclick="sendTxt();">send</button>
      </p>
          </div>

          <div id="content">            
      <button id="clear" onclick="clearScreen()" >Clear text</button>
      <div id="output"></div>
          </div>

        </div>
      </body>
    </html> 
    """
  end
end
```

You need to then exit the console, and run `SoMuchWebsockets.Router.start` again. (I'm pretty sure there's a much better way to do this, but bear with me first.) When you refresh, you should see something similar to the screenshot at the very beginning of this post.

Obviously, this will not work yet, because we have yet to implement the main meat of our application - The Websocket Handler.

### Implementing the Websocket Handler

#### 1. Create `websocket_handler` in `lib/so_much_websockets`:

```elixir
defmodule SoMuchWebsockets.WebSocketHandler do
  @behaviour :cowboy_websocket_handler

  def init({:tcp, :http}, _req, _opts) do
    {:upgrade, :protocol, :cowboy_websocket}
  end

  def websocket_init(_transport_name, req, _opts) do
    :erlang.start_timer(1000, self, "Hello!")
    {:ok, req, :undefined_state}
  end

  def websocket_handle({:text, msg}, req, state) do
    {:reply, {:text, "That's what she said! #{msg}"}, req, state}
  end

  def websocket_info({:timeout, _ref, msg}, req, state) do
    :erlang.start_timer(1000, self, "How' you doin'?")
    {:reply, {:text, msg}, req, state}
  end

  def websocket_info(_info, req, state) do
    {:ok, req, state}
  end

  def websocket_terminate(_reason, _req, _state) do
    :ok
  end
end
```

I'll leave you to find out what `websocket_handle` and `websocket_info` do.

__TL;DR__: The former handles messages _from the browser_, and the latter handles messages _to the server_.

You can experiment with this once the application is completed.

#### 2. Add routes to handle the websockets

Open `router.ex` and make it look like this:

```elixir
defmodule SoMuchWebsockets.Router do
  use Phoenix.Router, 
    port: 4000,
    dispatch: [
      { :_, [
          {"/stylesheets/[...]", :cowboy_static, {:dir, "priv/static/stylesheets"}},
          {"/javascript/[...]", :cowboy_static, {:dir, "priv/static/javascript"}},
          {"/ws", SoMuchWebsockets.WebSocketHandler, [] },
          {:_, Plug.Adapters.Cowboy.Handler, { __MODULE__, [] }}
      ]}
    ]

  get "/", SoMuchWebsockets.Controllers.Pages, :index, as: :page
end
```

#### 3. Add jQuery

First, create a `priv` directory, and create a `static` folder. Now in that `static` folder, create 2 more directories: `javascript` and `stylesheets`. 

In the `javascript` folder, download `jquery.min.js`. You can get a copy from [here](https://raw2.github.com/extend/cowboy/master/examples/websocket/priv/static/jquery.min.js).

This is how your directory structure should look like:

```
├── lib
│   ├── so_much_websockets
│   │   ├── controllers
│   │   │   └── pages.ex
│   │   ├── router.ex
│   │   ├── supervisor.ex
│   │   └── websocket_handler.ex
│   └── so_much_websockets.ex
├── mix.exs
├── mix.lock
├── priv
│   └── static
│       ├── javascript
│       │   └── jquery.min.js
│       └── stylesheets
└── test
    ├── so_much_websockets_test.exs
    └── test_helper.exs
```

### Paydirt!

Go to the console, and restart the router again, and refresh your browser. You should _finally_ see some text scrolling by.

Give yourself another pat in the back. You totally deserve this.

### I'm just not that smart

Please do not take what I said above as slamming Dynamo or Cowboy. Far from it. 

The point is I wasn't too smart in figuring out how to get websockets working on both Dynamo / Cowboy, and just _somehow_ managed to get it working on Phoenix after some tinkering and help from its creators.

Hopefully, this helps some poor soul struggling with Websockets. 

I feel you.
