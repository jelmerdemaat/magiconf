#!/usr/bin/env node

///////////////////////////////////////
// Variables

var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    colors = require('colors'),
    commander = require('commander'),
    Template = require('template'),
    template = new Template(),
    pkg = require( path.join(__dirname, 'package.json') );

var magiconf = {
  defaults: {
    source: getUserHome() + '/projects/',
    destination: './dist/sites/test/',
    extension: '.local',
    backups: getUserHome() + '/.magiconf-backups/'
  },
  vhosts: {
    source: '',
    destination: '',
    backups: '',
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
  .option('-b, --backups [backups]', 'Backup folder for old vhost files \n\t\t\t\t\t Default: ' + magiconf.defaults.backups)
  .parse(process.argv);

magiconf.vhosts.source = commander.directory || magiconf.defaults.source;
magiconf.vhosts.destination = commander.destination || magiconf.defaults.destination;
magiconf.vhosts.extension = commander.extension || magiconf.defaults.extension;
magiconf.vhosts.backups = commander.backups || magiconf.defaults.backups;

magiconf.vhosts.list = fs.readdirSync(magiconf.vhosts.source);

magiconf.vhosts.list = magiconf.vhosts.list.filter(function(file) {
  var p = path.join(magiconf.vhosts.source, file),
      stat = fs.statSync(p);

  // Ignore (hidden) files:
  if(file && file[0] != '.' && stat.isDirectory()) return true;
});

// console.info(magiconf.vhosts);

if(!fs.existsSync(magiconf.vhosts.destination)) {
  console.log(magiconf.vhosts.destination + ' does not yet exist, creating...');
  mkdirp(magiconf.vhosts.destination, function(error) {
    if (error) throw error;
    console.log(magiconf.vhosts.destination + ' created.');
    renderVhostFiles();
  });
} else {
  backupVhostFiles();
  renderVhostFiles();
}

function backupVhostFiles() {
  var existing_files = fs.readdirSync(magiconf.vhosts.destination);

  existing_files.forEach(function(name, i, array) {
    console.log(('Backing up ' + name + ' in ' + magiconf.defaults.backups + name + '...').grey);

    var dst = path.join(magiconf.vhosts.destination, name),
        bkp = path.join(magiconf.vhosts.backups, name);

    if(!fs.existsSync(magiconf.vhosts.backups)) {
      console.log(magiconf.vhosts.backups + ' does not yet exist, creating...');
      mkdirp(magiconf.vhosts.backups, function(error) {
        if (error) throw error;
        console.log(magiconf.vhosts.backups + ' created.');
        backupVhostFile(dst, bkp, name);
      });
    } else {
      backupVhostFile(dst, bkp, name);
    }
  });
}

function backupVhostFile(src, dst, name) {
  copyFile(src, dst, function(error) {
    if(error) throw error;
    console.log('✓'.green + ' Backed up ' + name + ' in ' + (dst).yellow + '!');
  });
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
    });
}


///////////////////////////////////////
// Functions from external resources


// Get user home directory
// http://stackoverflow.com/a/9081436

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}


// Copy files in Node
// http://stackoverflow.com/a/14387791

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on('error', function(err) {
    done(err);
  });

  var wr = fs.createWriteStream(target);
  wr.on('error', function(err) {
    done(err);
  });

  wr.on('close', function(ex) {
    done();
  });

  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}
