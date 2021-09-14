/*
 * Copyright © 2021 Michał Przybyś <michal@przybys.eu>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var child_process = require('child_process');
var DependencyResolver = require(`${__dirname}/../${process.env.npm_package_name}/node_modules/dependency-resolver`);
var fs = require('fs');

function addUsedHelpers(packageName) {
  var packageJson = fs.readFileSync(`${__dirname}/../${packageName}/package.json`, 'utf8');
  var package = JSON.parse(packageJson);
  var usedHelpers = Object.keys(package.dependencies)
    .filter(dependency => dependency.startsWith('helpers-'));


  resolver.add(packageName);
  usedHelpers.forEach(helper => resolver.setDependency(packageName, helper));
}

function addAllHelpers() {
  return fs.readdirSync(`${__dirname}/..`)
    .filter(directory => directory.startsWith('helpers-'))
    .forEach(helper => {
      console.log(`Processing ${helper} with dry`);
      child_process.execSync('dry -v --dry-keep-package-json', {
        cwd: `${__dirname}/../${helper}`,
        stdio: 'inherit'
      });
      addUsedHelpers(helper);
    });
}

function buildHelpers() {
  console.log('Start building helpers');
  resolver.resolve(process.env.npm_package_name)
    .filter(package => package !== process.env.npm_package_name)
    .forEach(helper => {
      console.log(`Installing ${helper} dependencies`);
      child_process.execSync('yarn', {
        cwd: `${__dirname}/../${helper}`,
        stdio: 'inherit'
      });
      console.log(`Building ${helper}`);
      child_process.execSync('yarn run build-this', {
        cwd: `${__dirname}/../${helper}`,
        stdio: 'inherit'
      });
    })
  console.log('End building helpers');
}

var resolver = new DependencyResolver();
addUsedHelpers(process.env.npm_package_name);
addAllHelpers();
buildHelpers();
