#!/usr/bin/env node

///////////////////////////////////////
// Variables

var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    commander = require('commander'),
    Template = require('template'),
    template = new Template(),
    pkg = require( path.join(__dirname, 'package.json') );

var magiconf = {
  defaults: {
    source: getUserHome() + '/projects/',
    destination: './dist/sites/test',
    extension: '.local'
  },
  vhosts: {
    source: '',
    destination: '',
    list: []
  }
};


///////////////////////////////////////
// Application code

commander
  .version(pkg.version)
  .option('-s, --source [source]', 'Source directory containing your vhost folders \n\t\t\t\t\t Default: ' + magiconf.defaults.source)
  .option('-d, --destination [destination]', 'Destination directory for your vhost configuration \n\t\t\t\t\t Default: ' + magiconf.defaults.destination)
  .option('-e, --extension [extension]', 'Extension of vhost domain name \n\t\t\t\t\t Default: ' + magiconf.defaults.extension)
  .parse(process.argv);

magiconf.vhosts.source = commander.directory || magiconf.defaults.source;
magiconf.vhosts.destination = commander.destination || magiconf.defaults.destination;
magiconf.vhosts.extension = commander.extension || magiconf.defaults.extension;
magiconf.vhosts.list = fs.readdirSync(magiconf.vhosts.source);

magiconf.vhosts.list = magiconf.vhosts.list.filter(function(file) {
  var p = path.join(magiconf.vhosts.source, file),
      stat = fs.statSync(p);

  // Ignore (hidden) files:
  if(file && file[0] != '.' && stat.isDirectory()) {
    return true;
  }
});

console.info(magiconf);

if(!fs.existsSync(magiconf.vhosts.destination)) {
  console.log(magiconf.vhosts.destination + ' does not yet exist, creating...');
  mkdirp(magiconf.vhosts.destination, function(error) {
    if (error) throw error;
    console.log(magiconf.vhosts.destination + ' created.');

    renderVhostFiles();
  });
} else {
  console.log('Backing up existing vhosts in ~/.magiconf-backups...')
  renderVhostFiles();
}

function renderVhostFiles() {
  magiconf.vhosts.list.forEach(function(name, i, array) {
    var p = path.join(magiconf.vhosts.source, name);

    template.page('vhost.tmpl', {
      vhost_name: magiconf.vhosts.list[i],
      vhost_directory: p,
      vhost_extension: magiconf.vhosts.extension
    });

    template.render('vhost.tmpl', function(error, content) {
      if (error) throw error;
      writeVhostFile(name, content);
    });
  });
}

function writeVhostFile(name, content) {
    var p = path.join(magiconf.vhosts.destination, name);

    fs.writeFile(p, content, function (error) {
      if (error) throw error;
      console.log('It\'s saved!');
    });
}


///////////////////////////////////////
// Functions

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
