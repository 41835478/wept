const path = require('path')
const chalk = require('chalk')
const et = require('et-improve')
const fs = require('fs')
const glob = require('glob')
const Parallel = require('node-parallel')

exports.globJSfiles = function () {
  return new Promise(function (resolve, reject) {
    glob('**/*.js', {}, function (err, files) {
      if (err) return reject(err)
      resolve(files)
    })
  })
}

exports.loadJSONfiles = function (pages) {
  let p = new Parallel()
  let res = {}
  return function (done) {
    for (let page of pages) {
      let file = page + '.json'
      p.add(cb => {
        fs.stat(file, function (err, stat) {
          if (stat && stat.isFile()) {
            fs.readFile(file, 'utf8', (err, content) => {
              if (err) return cb()
              try {
                res[page] = JSON.parse(content)
              } catch(e) {
                return cb(new Error(`${file} JSON 解析失败，请检查`))
              }
              cb()
            })
          } else {
            return cb()
          }
        })
      })
    }
    p.done(err => {
      if (err) return done(err)
      done(null, res)
    })
  }
}

let id = 1
exports.uid = function () {
  return id++
}

exports.exists = function (p) {
  return new Promise(function (resolve) {
    fs.stat(p, function (err, stats) {
      if (err) return resolve(false)
      if (stats.isFile()) {
        return resolve(true)
      }
      resolve(false)
    })
  })
}

exports.parseImports = function (xml) {
  var re = /<import\s+[^>]+?>/g
  var res = []
  var arr = []
  while ((arr = re.exec(xml)) !== null) {
    let ms = arr[0].match(/src="([^"]+)"/)
    if (ms && ms[1]) {
      res.push(ms[1])
    }
  }
  return res
}

exports.loadTemplate = function (name) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path.resolve(__dirname, `../template/${name}.html`), 'utf8', (err, content) => {
      if (err) return reject(err)
      try {
        resolve(et.compile(content))
      } catch(e) {
        console.error(e.stack)
        reject(e)
      }
    })
  })
}

exports.groupFiles= function (files, config) {
  let pages = config.pages.map(page => {
    return page + '.js'
  })
  let utils = []
  let routes = []
  files.forEach(function (file) {
    if (pages.indexOf(file) == -1 && file !== 'app.js') {
      utils.push(file)
    }
  })
  pages.forEach(function (page) {
    if (files.indexOf(page) == -1) {
      console.log(chalk.red(` ✗ ${page} not found`))
    } else {
      routes.push(page)
    }
  })
  return [utils, routes]
}

exports.normalizePath = function (p) {
  return p.replace(/\\/g, '/')
}
