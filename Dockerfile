FROM paasmule/rbenv
RUN rbenv install 2.3.0 && \
  bundle config build.libv8 --with-system-v8 && \
  bundle config build.eventmachine --with-cppflags=-I/usr/local/opt/openssl/include && \
  rbenv global 2.3.0 && \
  gem install bundler

