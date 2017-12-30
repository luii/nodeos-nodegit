# NodeOS-nodegit #

Building nodegit for NodeOS with the cross building toolchain

## Quickstart ##

```bash
$ npm install -S @nodeos/nodegit
```

## Building Steps ##

That's are the steps to build Nodegit
Instead of `node-pre-gyp` i used `node-gyp` with `prebuilt-install`
to make use of precompiled binaries.

1) Setting up the Cross building toolchain
2) Getting some Environment Variables (and defining some of them)
3) Downloading Nodegit (without Submodules)
4) Installing only Nodegit's dependencies
5) Downloading `libssh2` (because `curl` cant download them)
6) Running `autoreconf -fi` (to get rid of the `missing` script warning)
7) Configuring `libssh2` with `openssl`
8) Building Nodegit
9) Generating the `dist/` and `lib/` folder
10) Copying over all to the base folder and unpacking itself
11) Creating corresponding prebuilds for `prebuild-install`  