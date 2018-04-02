/* jshint esversion: 6, asi: true */

let package        = require('./package.json')
let TOOLCHAIN_PATH = require('nodeos-cross-toolchain')

let del            = require('del')
let log            = require('gulplog')
let gulp           = require('gulp')
let download       = require('gulp-downloader')
let decompress     = require('gulp-decompress')
let environment    = require('gulp-env')

const NODEGIT_URL        = `https://codeload.github.com/nodegit/nodegit/tar.gz/v${package.nodegitVersion}`
const LIBGIT2_URL        = `https://codeload.github.com/nodegit/libgit2/tar.gz/da12bb8`
const NODEOS_LIBCURL_URL = `https://codeload.github.com/luii/nodeos-libcurl/tar.gz/99a221c`

/**
 * @author jaredhanson
 * @param  {Object} parent The parent object that gets the child merged in
 * @param  {Object} child  The child object which gets merged into the parent
 * @return {Object}        Returns a merged object
 */
// let mergeObj = (parent, child) => {
//     if (parent && child) {
//         for (var key in child) {
//           parent[key] = child[key];
//         }
//       }
//     return parent;
// }


// let paths = {}
// let buildEnv = () => { 
//     source(`${TOOLCHAIN_PATH}/scripts/adjustEnvVars.sh`, { source: false }, (err, env) => {
//         if (err) {
//             log.error(err)
//             return exit(0)
//         }

//         paths = {
//             CURL_SRC_DIR: 'deps/curl',
//             OPENSSL_SRC_DIR: 'deps/openssl',
//             ZLIB_SRC_DIR: 'deps/zlib',

//             OBJ_DIR: `build/${env.CPU}`,
//             OUT_DIR: `out/${env.CPU}`
//         }

//         return environment.set(env)
//     })
// }

// buildEnv()

gulp.task('clean', () => {
    log.debug('Remove build/ deps/ out/')
    return del([ 'build/', 'deps/', 'out/' ])
})

gulp.task('download-nodegit', () => {
    log.debug(`download nodegit@${package.nodegitVersion}`)
    return download(NODEGIT_URL)
        .pipe(decompress({ strip: 1 }))
        .pipe(gulp.dest('deps/nodegit'))
})

gulp.task('download-nodeos-libcurl', () => {
    log.debug('download nodeos-libcurl@99a221c')
    return download(NODEOS_LIBCURL_URL)
        .pipe(decompress({ strip: 1 }))
        .pipe(gulp.dest('deps/nodeos-libcurl'))
})

gulp.task('download-libgit2', () => {
    log.debug('download libgit2@da12bb8')
    return download(LIBGIT2_URL)
        .pipe(decompress({ strip: 1 }))
        .pipe(gulp.dest('deps/nodegit/vendor/libgit2'))
})

gulp.task('download', gulp.parallel('download-nodegit', 'download-nodeos-libcurl', 'download-libgit2'))


gulp.task('prepare-curl', () => {
    log.debug('prepare curl environment')
    let curlEnv = environment.set({
        CROSS_COMPILE:  process.env.TARGET,
        CC:             `${process.env.TARGET}-gcc`,
        AR:             `${process.env.TARGET}-ar`,
        AS:             `${process.env.TARGET}-as`,
        LD:             `${process.env.TARGET}-ld`,
        NM:             `${process.env.TARGET}-nm`,
        PATH:           `${TOOLCHAIN_PATH}/bin:${process.env.PATH}`,
        RANLIB:         `${process.env.TARGET}-ranlib`,
        CPPFLAGS:       `-I${process.env.PWD}/${paths.OUT_DIR}/openssl/include -I${process.env.PWD}/${paths.OUT_DIR}/zlib/include -I${TOOLCHAIN_PATH}/${process.env.TARGET}/include`,
        LDFLAGS:        `-L${process.env.PWD}/${paths.OUT_DIR}/openssl/lib/libssl.a -L${process.env.PWD}/${paths.OUT_DIR}/zlib/lib/libz.a`
    })

    let args = [
        `--host=${process.env.HOST}`,
        `--target=${process.env.TARGET}`,
        `--prefix=${process.env.PWD}/${paths.OUT_DIR}/curl`,
        '--with-random=/dev/urandom',
        '--disable-manual',
        '--disable-shared',
        '--enable-static',
        '--disable-verbose',
        '--disable-ipv6',
        '--with-ssl',
        '--with-zlib',
        '--silent'
    ]

    return gulp.src(`${process.env.PWD}/${paths.CURL_SRC_DIR}/configure`)
               .pipe(shell(`cd ${process.env.PWD}/${paths.CURL_SRC_DIR} && ./configure ${args.join(' ')}`))
               .pipe(curlEnv.reset)
})


gulp.task('prepare', gulp.series('prepare-curl'))
gulp.task('toolchain', shell.task(`cd ${TOOLCHAIN_PATH} && BITS=${process.env.BITS} CPU=${process.env.CPU} MACHINE=${process.env.MACHINE} npm install --production && cd ${process.env.PWD}`))
gulp.task('configure', gulp.series('clean', 'toolchain', 'download', 'prepare'))
gulp.task('build-curl', () => {
    log.debug('build curl')
    let buildCurlEnv = environment.set({
        PATH: `${TOOLCHAIN_PATH}/bin:${process.env.PATH}`
    })

    let args = [
        `-j${process.env.JOBS}`
    ]

    return gulp.src(`${process.env.PWD}/${paths.CURL_SRC_DIR}`)
               .pipe(shell(`cd ${process.env.PWD}/${paths.CURL_SRC_DIR} && make ${args.join(' ')}`))
               .pipe(shell(`cd ${process.env.PWD}/${paths.CURL_SRC_DIR} && make install ${args.join(' ')}`))
               .pipe(buildCurlEnv.reset)
})

gulp.task('build', gulp.series('build-zlib', 'build-openssl', 'build-curl'))
gulp.task('prebuilt', () => {})
gulp.task('default', gulp.series('configure', 'build'))