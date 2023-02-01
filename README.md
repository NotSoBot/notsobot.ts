# notsobot.ts
NotSoBot dot ts



# running
```
sudo npm run build && sudo npm run launch
```

# jemalloc
```
wget https://github.com/jemalloc/jemalloc/releases/download/5.3.0/jemalloc-5.3.0.tar.bz2 -O jemalloc.tar.bz2 && mkdir -p jemalloc && tar -vxjf jemalloc.tar.bz2 --strip-components=1 -C jemalloc && rm jemalloc.tar.bz2 && cd jemalloc && ./configure && make && sudo make install && cd ../
echo "/usr/local/lib/libjemalloc.so" | sudo tee -a /etc/ld.so.preload > /dev/null
```
