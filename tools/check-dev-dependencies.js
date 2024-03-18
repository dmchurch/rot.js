const semverSatisfies = require('semver/functions/satisfies');

var checkVersion, exec, execAsync, exitCode;

exitCode = 0;

({exec} = require("child_process"));

execAsync = function(command) {
  return new Promise(function(resolve, reject) {
    return exec(command, function(err, stdout, stderr) {
      if (err != null) {
        return reject(err);
      }
      return resolve({
        stdout: stdout,
        stderr: stderr
      });
    });
  });
};

checkVersion = async function(dependency, versionSpec, version) {
  var latest, stdout;
  ({stdout} = (await execAsync(`npm --json info ${dependency}`)));
  ({latest} = JSON.parse(stdout)["dist-tags"]);
  if (latest !== version) {
    if (semverSatisfies(latest, versionSpec)) {
      return console.log(`[STALE] ${dependency} can be updated from ${version} to ${latest}`);
    } else {
      exitCode = 1;
      return console.log(`[OLD] ${dependency} is out of date ${version} (${versionSpec}) vs. ${latest}`);
    }
  }
};

(async function() {
  var dependency, project;
  project = require("../package.json");
  const packageLock = require("../package-lock.json");
  const checks = [];
  for (dependency in project.devDependencies) {
    checks.push(checkVersion(dependency, project.devDependencies[dependency], packageLock.packages[`node_modules/${dependency}`]?.version));
  }
  await Promise.all(checks);
  process.exit(exitCode)
})();
