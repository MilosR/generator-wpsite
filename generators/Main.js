"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");
const mysql = require('mysql');
const fs = require('fs-extra')
const WP = require('wp-cli');
const {exec} = require('child_process');
const path = require('path');
const _cliProgress = require('cli-progress');
const https = require('https');
const StreamZip = require('node-stream-zip');

module.exports = class extends Generator {


    /**
     * Constructor
     * @param args
     * @param opts
     */
    constructor(args, opts) {

        super(args, opts)


        /**
         * Check PHP
         */
        this._checkPHP = () => {

            return new Promise((resolve, reject) => {

                exec('php -v', (err, stdout, stderr) => {
                    if (err || stderr) {
                        this.env.error('PHP Binary not found. Please ensure that php is available globally by adding it to path.')
                        reject();
                    }
                    else {
                        resolve();
                    }

                });

            })
        }

        /**
         * Check MySQL
         */
        this._checkMySQL = () => {

            return new Promise((resolve, reject) => {

                exec('mysql -?', (err, stdout, stderr) => {
                    if (err || stderr) {
                        this.env.error('MySQL Binary not found. Please ensure that mysql is available globally by adding it to path.')
                        reject();
                    }
                    else {
                        resolve();
                    }

                });

            })


        }

        /**
         * Download file
         * @param options
         * @returns {Promise}
         */
        this._downloadFile = (options) => {

            return new Promise((resolve, reject) => {

                let file = fs.createWriteStream(options.filename);

                const bar = new _cliProgress.Bar({
                    format: "Downloading " + options.name + "... {bar} {percentage}% | ETA: {eta}s | {value}MB/{total}MB"
                }, _cliProgress.Presets.shades_classic);

                let request = https.get(options.url, (response) => {

                    let totalSize = parseInt(response.headers['content-length'], 10) / 1048576;
                    let downloaded = 0;

                    bar.start(totalSize.toFixed(2), 0);

                    response.pipe(file);

                    response.on("data", (chunk) => {
                        downloaded += chunk.length / 1048576
                        bar.update(downloaded.toFixed(2))
                    });


                })

                file.on('finish', () => {
                    file.close();
                    bar.stop();
                    resolve();
                });

                request.on('error', (err) => {
                    fs.unlinkSync(wpTempFilename);
                    this.env.error('Error downloading ' + options.name + ': ' + err);
                    reject();
                });

            })

        };

        /**
         * Unzip file
         * @param options
         * @returns {Promise}
         */
        this._extractZip = (options) => {

            return new Promise((resolve, reject) => {

                this.log("Unzipping " + options.name + "...")

                let zip = new StreamZip({
                    file: options.filename,
                    storeEntries: true
                });

                zip.on('ready', () => {

                    zip.extract(options.zipDir, options.outputDir, error => {

                        if (error) {
                            this.env.error('Error unzipping ' + options.name + ': ' + error);
                            reject();
                        } else {
                            resolve();
                        }

                        zip.close();
                    });

                });

                zip.on('error', error => {
                    this.env.error('Error unzipping ' + options.name + ': ' + error);
                    reject();
                });


            })

        };

        /**
         * Print separator
         */
        this._printSeparator = () => {
            this.log("\n\n-------------------------------\n")
        }

        /**
         * Create DB
         * @param options
         * @returns {Promise}
         */
        this._createDatabase = (options) => {
            return new Promise((resolve, reject) => {

                this.log("Creating Database...")

                var connection = mysql.createConnection({
                    host: "localhost",
                    user: options.dbUser,
                    password: options.dbPassword
                });

                connection.connect((error) => {
                    if (error) {
                        this.env.error('Error connecting to database: ' + error.stack)
                        reject();
                        return;
                    }

                    connection.query('CREATE DATABASE `' + options.dbName + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', (error) => {
                        if (error) {
                            this.env.error('Error connecting to database: ' + error.stack);
                            reject();
                        } else {
                            this.log("Database \"" + this.props.dbName + "\" created.")
                            resolve();
                        }

                        connection.end();
                    });

                });

            })
        }

        /**
         * Setup WP Cli
         * @returns {Promise}
         */
        this._setupWPCLI = () => {

            return this._downloadFile({
                name: "WP CLI",
                url: "https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar",
                filename: 'wp-cli.phar'
            }).then(() => {

                return new Promise((resolve, reject) => {

                    fs.writeFile('wp.bat', "@ECHO OFF && php \"" + process.cwd() + "/" + 'wp-cli.phar' + "\" %*", (error) => {

                        if (error) {
                            this.env.error("WP CLI Setup error: " + error)
                            reject();
                        } else {
                            resolve();
                        }

                    });

                })

            })

        }

        /**
         * Install WP
         * @param options
         */
        this._installWP = (options) => {

            return new Promise((resolve, reject) => {

                WP.discover((WP) => {

                    this.log("Configuring WordPress...")

                    WP.config.create({
                        dbname: options.dbName,
                        dbuser: options.dbUser,
                        dbpass: options.dbPassword,
                        dbhost: "localhost",
                        dbcharset: "utf8mb4",
                        dbcollate: "utf8mb4_unicode_ci",
                        'extra-php': "#WPSITE-GENERATOR-REPLACE-HERE"
                    }, (error) => {

                        if (error) {
                            this.env.error('Error config. WordPress: ' + error)
                            reject();
                        }
                        else {


                            fs.readFile("wp-config.php", "utf8", (error, data) => {

                                if (error) {

                                    this.env.error('Error configuring WordPress: ' + error)
                                    reject();

                                }
                                else {

                                    let extraPhp = "define('WPSITE_DEV', true);\n" +
                                        "define('DISALLOW_FILE_EDIT', true);"

                                    data = data.replace("#WPSITE-GENERATOR-REPLACE-HERE", extraPhp)

                                    fs.writeFile("wp-config.php", data, (error) => {

                                        if (error) {

                                            this.env.error('Error configuring WordPress: ' + error)
                                            reject();

                                        }
                                        else {

                                            this.log("Installing WordPress...")

                                            WP.core.install({
                                                title: options.websiteName,
                                                url: options.websiteUrl,
                                                admin_email: "temp@temp.domain",
                                                admin_user: "admin",
                                                admin_password: "admin",
                                                "skip-email": true
                                            }, (error) => {

                                                if (error) {
                                                    this.env.error('Error installing WordPress: ' + error)
                                                    reject();
                                                } else {
                                                    this.log("WordPress Installed.")
                                                    resolve();
                                                }

                                            })

                                        }

                                    })

                                }

                            })


                        }


                    })


                });

            })

        }

        /**
         * Activate theme
         * @param themeName
         * @returns {Promise}
         */
        this._activateTheme = (themeName) => {

            return new Promise((resolve, reject) => {

                WP.discover((WP) => {

                    this.log("Activating \"" + themeName + "\" theme...")

                    WP.theme.activate(themeName, {}, (error) => {

                        if (error) {
                            this.env.error('Error activating theme: ' + error)
                            reject();
                        } else {
                            resolve();
                        }

                    })

                });


            })

        }

        /**
         * Install plugins
         * @param plugins
         * @returns {Promise}
         */
        this._installPlugins = (plugins) => {

            var promises = [];

            this.log("Installing plugins...")

            plugins.forEach((pluginName) => {
                promises.push(new Promise((resolve, reject) => {

                    WP.discover((WP) => {
                        WP.plugin.install(pluginName, {
                            activate: true,
                        }, (error) => {

                            if (error) {
                                console.log('Error installing ' + pluginName + ' plugin: ' + error)
                                resolve();
                            } else {
                                resolve();
                            }

                        })
                    });

                }))
            })


            return Promise.all(promises)

        }

        /**
         * NPM Install
         * @param themeDir
         * @returns {Promise}
         */
        this._npmInstallTheme = (themeDir) => {

            return new Promise((resolve, reject) => {

                this.log("Theme node.js project install (this may take a while)...")

                process.chdir('.' + path.sep + "wp-content" + path.sep + "themes" + path.sep + themeDir);

                exec('npm install', (err, stdout, stderr) => {
                    if (err) {
                        this.env.error('Error trying to install node.js project: ' + stderr)
                        reject();
                    }
                    else {
                        resolve();
                    }

                })


            })

        }

        /**
         * Clean
         */
        this._removeWPCLI = () => {
            fs.unlinkSync('wp-cli.phar');
            fs.unlinkSync('wp.bat');
        }
    }

};
