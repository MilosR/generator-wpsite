"use strict";
const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");
const mysql = require('mysql');
const slug = require('slugg')
const fs = require('fs-extra')
const WP = require('wp-cli');
const {exec} = require('child_process');
const path = require('path');
const _cliProgress = require('cli-progress');
const https = require('https');
const StreamZip = require('node-stream-zip');
const hostile = require('hostile')

const config = {
    wpTempFilename: 'wp_temp.zip',
    wpCliTempFilename: 'wp-cli.phar',
    wpCliTempBat: 'wp.bat',
};

module.exports = class extends Generator {


    /**
     * Constructor
     * @param args
     * @param opts
     */
    constructor(args, opts) {

        super(args, opts)


        /**
         * Download file
         * @param options
         * @returns {Promise}
         */
        this.downloadFile = (options) => {

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
        this.extractZip = (options) => {

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
    }

    /**
     * Banner
     */
    banner() {

        this.log(
            yosay(`Welcome to the ${chalk.blue("generator-wpsite")} generator!`)
        );

    }


    /**
     * Chk dir
     * @returns {Promise}
     */
    checkDirectory() {

        return new Promise((resolve, reject) => {

            fs.readdir(process.cwd(), (err, files) => {
                if (files.length || err) {
                    this.env.error('Directory must be empty!')
                    reject();
                }
                else {
                    resolve();
                }
            })

        })

    }

    /**
     * Check if PHP is in path
     * @returns {Promise}
     */
    checkPHP() {

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
     * Check if MySQL is in path
     * @returns {Promise}
     */
    checkMySQL() {

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
     * Prompt
     * @returns {Promise|*|Promise.<TResult>}
     */
    promptProjectName() {

        return this.prompt([{
            type: "input",
            name: "projectName",
            message: "Enter project name (nice name)",
            required: true,
        }]).then(props => {

            this.projectName = props.projectName;
            this.projectSlug = slug(props.projectName);

        });

    }


    /**
     * Prompt
     * @returns {Promise|*|Promise.<TResult>}
     */
    promptProjectDetails() {


        return this.prompt([{
            type: "input",
            name: "themeName",
            message: "Enter theme name",
            default: this.projectSlug,
            required: true,
        }, {
            type: "input",
            name: "websiteUrl",
            message: "Enter website URL",
            default: "http://" + this.projectSlug + ".wpsite",
            required: true,
        }, {
            type: "input",
            name: "dbName",
            message: "Enter MySQL database name",
            default: this.projectSlug,
            required: true,
        }, {
            type: "input",
            name: "dbUser",
            message: "Enter MySQL database user",
            default: "root",
            required: true,
        }, {
            type: "input",
            name: "dbPassword",
            message: "Enter MySQL database password",
            default: "",
            required: true,
        }
        ]).then(props => {

            this.props = props;

        });


    }

    /**
     * Separator
     */
    printSeparator() {

        this.log("\n\n-------------------------------\n")

    }

    /**
     * Create DB
     * @returns {Promise}
     */
    createDatabase() {

        return new Promise((resolve, reject) => {

            this.log("Creating Database...")

            var connection = mysql.createConnection({
                host: "localhost",
                user: this.props.dbUser,
                password: this.props.dbPassword
            });

            connection.connect((error) => {
                if (error) {
                    this.env.error('Error connecting to database: ' + error.stack)
                    reject();
                    return;
                }

                connection.query('CREATE DATABASE `' + this.props.dbName + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', (error) => {
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
     * Downloads WP Cli
     * @returns {Promise}
     */
    downloadWPCLI() {

        return this.downloadFile({
            name: "WP CLI",
            url: "https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar",
            filename: config.wpCliTempFilename
        })

    }

    /**
     * Downloads WP Cli
     * @returns {Promise}
     */
    setupWPCLI() {

        return new Promise((resolve, reject) => {

            fs.writeFile(config.wpCliTempBat, "@ECHO OFF && php \"" + process.cwd() + "/" + config.wpCliTempFilename + "\" %*", (error) => {

                if (error) {
                    this.env.error("WP CLI Setup error: " + error)
                    reject();
                } else {
                    resolve();
                }

            });

        })


    }

    /**
     * Downloads WP (faster than WP Cli method)
     * @returns {Promise}
     */
    downloadWP() {

        return this.downloadFile({
            name: "WordPress",
            url: "https://wordpress.org/latest.zip",
            filename: config.wpTempFilename
        })

    }

    /**
     * Extract WP
     * @returns {Promise}
     */
    extractWP() {

        return this.extractZip({
            name: 'WordPress',
            filename: config.wpTempFilename,
            zipDir: 'wordpress/',
            outputDir: './'
        })

    }

    /**
     * Remove unused files
     */
    cleanWordPress() {

        this.log("Cleaning WordPress installation")

        fs.removeSync('./wp-content/plugins/akismet')
        fs.removeSync('./wp-content/plugins/hello.php')
        fs.removeSync('./wp-content/themes/')
        fs.mkdirSync('./wp-content/themes/');
        fs.writeFileSync('./wp-content/themes/index.php', "");

    }

    /**
     * Create Theme and copy template files
     * @returns {Promise}
     */
    createTheme() {

        return new Promise( (resolve, reject) => {

            this.log("Copying template files...")

            fs.mkdirSync('./wp-content/themes/' + this.projectSlug);
            fs.copySync(this.templatePath(".htaccess"), ".htaccess", {
                globOptions: {
                    dot: true
                }
            });

            this.fs.copyTpl(
                this.templatePath('theme/**/*'),
                this.destinationPath('./wp-content/themes/' + this.projectSlug), {
                    themeName: this.projectName,
                    themeSlug: this.projectSlug,
                },
                undefined, {
                    globOptions: {
                        dot: true
                    }
                }
            )

            this.fs.commit(resolve);

        } )

    }

    /**
     * Install WP using WP-CLI
     * @returns {Promise}
     */
    installWP() {

        return new Promise((resolve, reject) => {

            WP.discover((WP) => {

                this.log("Configuring WordPress...")


                WP.config.create({
                    dbname: this.props.dbName,
                    dbuser: this.props.dbUser,
                    dbpass: this.props.dbPassword,
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
                                            title: this.projectName,
                                            url: this.props.websiteUrl,
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
     * Activates theme
     * @returns {Promise}
     */
    activateTheme() {

        return new Promise((resolve, reject) => {

            WP.discover((WP) => {

                this.log("Activating \""+ this.projectSlug +"\" theme...")

                WP.theme.activate( this.projectSlug, {}, (error) => {

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
     * @returns {Promise}
     */
    installPlugins() {

        return new Promise((resolve, reject) => {

            WP.discover((WP) => {

                this.log("Installing plugins...")

                WP.plugin.install("piklist", {
                    activate: true,
                }, (error) => {

                    if (error) {
                        this.env.error('Error installing Piklist plugin: ' + error)
                        reject();
                    } else {
                        resolve();
                    }

                })

            });


        })

    }

    /**
     * Clean
     */
    clean() {

        this.log("Removing temp files")

        fs.unlinkSync(config.wpTempFilename);
        fs.unlinkSync(config.wpCliTempFilename);
        fs.unlinkSync(config.wpCliTempBat);

    }

    /**
     * Do "npm install" inside theme
     * @returns {Promise}
     */
    npmInstallTheme() {

        return new Promise((resolve, reject) => {

            this.log("Theme node.js project install (this may take a while)...")

            process.chdir('.' + path.sep + "wp-content" + path.sep +  "themes" + path.sep + this.projectSlug);

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
     * Separator
     */
    printSummery() {

        this.log("\n\n-------------------------------\n")
        this.log("Environment configured. After you setup Virtual Host you should be able to open website on address:\n")
        this.log("\tWebsite URL: " + chalk.blue(this.props.websiteUrl))
        this.log("\tWordPress username: " + chalk.blue("admin"))
        this.log("\tWordPress password: " + chalk.blue("admin"))
        this.log("\n\n")

    }

};
