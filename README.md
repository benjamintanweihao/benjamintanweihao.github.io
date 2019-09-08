1. `docker run -it --rm -v "$(PWD)":/blog -v ~/.ssh/id_rsa:/root/.ssh/id_rsa -v ~/.gitconfig:/root/.gitconfig -p 4567:4567 benjamintanweihao/blog /bin/bash`
2. `cd /blog && bundle exec middleman`
3. Open `http://localhost:4567` on the host computer.
