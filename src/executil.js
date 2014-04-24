/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

var apputil = require('./apputil');
var superspawn = require('./superspawn');
var print = apputil.print;

var gitCommitCount = 0;

exports.ARGS = function(s, var_args) {
    var ret = s.trim().split(/\s+/);
    for (var i = 1; i < arguments.length; ++i) {
        ret.push(arguments[i]);
    }
    return ret;
}

exports.execHelper = function(cmdAndArgs, silent, allowError) {
    // there are times where we want silent but not allowError.
    if (null == allowError) {
        // default to allow failure if being silent.
        allowError = allowError || silent;
    }
    if (/^git commit/.exec(cmdAndArgs.join(' '))) {
        gitCommitCount++;
    }
    cmdAndArgs[0] = cmdAndArgs[0].replace(/^git /, 'git -c color.ui=always ');
    if (!silent) {
        print('Executing:', cmdAndArgs.join(' '));
    }
    // silent==2 is used only when modifying ulimit and re-exec'ing,
    // so don't be silent but allow whatever to happen.
    var result = superspawn.spawn(cmdAndArgs[0], cmdAndArgs.slice(1), {stdio: (silent && (silent !== 2)) ? 'default' : 'inherit'});
    return result.then(null, function(e) {
        if (allowError) {
            return null;
        } else if (!(silent === true)) {
            print(e.output);
        }
        process.exit(2);
    });
}

exports.reportGitPushResult = function(repos, branches) {
    print('');
    if (gitCommitCount) {
        var flagsStr = repos.map(function(r) { return '-r ' + r.id; }).join(' ') + ' ' + branches.map(function(b) { return '-b ' + b; }).join(' ');
        print('All work complete. ' + gitCommitCount + ' commits were made locally.');
        print('To review changes:');
        print('  ' + process.argv[1] + ' repo-status ' + flagsStr + ' | less');
        print('To push changes:');
        print('  ' + process.argv[1] + ' repo-push ' + flagsStr);
        print('To revert all local commits:');
        print('  ' + process.argv[1] + ' repo-reset ' + flagsStr);
    } else {
        print('All work complete. No commits were made.');
    }
}

