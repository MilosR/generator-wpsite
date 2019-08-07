"use strict";
const Generator = require("../Main");
const chalk = require("chalk");
const yosay = require("yosay");
const mysql = require('mysql');
const slug = require('slugg')
const fs = require('fs-extra')
const {exec} = require('child_process');
const path = require('path');


module.exports = class extends Generator {


    /**
     * Constructor
     * @param args
     * @param opts
     */
    constructor(args, opts) {

        super(args, opts)

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
     * Check for MySQL and PHP
     * @returns {*|Promise.<TResult>|Promise}
     */
    checks(){
        return this._checkMySQL()
            .then(this._checkPHP)
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

        this._printSeparator();

    }

    /**
     * Create DB
     * @returns {Promise}
     */
    createDatabase() {

        return this._createDatabase({
            dbUser: this.props.dbUser,
            dbPassword: this.props.dbPassword,
            dbName: this.props.dbName
        })

    }

    /**
     * Downloads WP Cli
     * @returns {Promise}
     */
    setupWPCLI() {

        return this._setupWPCLI();

    }

    /**
     * Downloads WP (faster than WP Cli method)
     * @returns {Promise}
     */
    downloadWP() {

        return this._downloadFile({
            name: "WordPress",
            url: "https://wordpress.org/latest.zip",
            filename: 'wp_temp.zip'
        })

    }

    /**
     * Extract WP
     * @returns {Promise}
     */
    extractWP() {

        return this._extractZip({
            name: 'WordPress',
            filename: 'wp_temp.zip',
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
            fs.copySync(this.templatePath("gitignore.txt"), ".gitignore", {
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

        return this._installWP({
            dbName: this.props.dbName,
            dbUser: this.props.dbUser,
            dbPassword: this.props.dbPassword,
            websiteName: this.projectName,
            websiteUrl: this.props.websiteUrl,
        })

    }

    /**
     * Activates theme
     * @returns {Promise}
     */
    activateTheme() {

        return this._activateTheme( this.projectSlug )

    }

    /**
     * Install plugins
     * @returns {Promise}
     */
    installPlugins() {

        return this._installPlugins( ["piklist"] )

    }

    /**
     * Downloads WP Cli
     * @returns {Promise}
     */
    removeWPCLI() {

        return this._removeWPCLI();

    }

    /**
     * Clean
     */
    clean() {

        fs.unlinkSync('wp_temp.zip');

    }

    /**
     * Write Wpsite File
     */
    createWpsiteFile() {

        let wpsite = {
            projectSlug: this.projectSlug,
            projectName: this.projectName,
            themeName: this.props.themeName,
        }

        fs.writeFileSync(".wpsite", JSON.stringify(wpsite) );

    }


    /**
     * Do "npm install" inside theme
     * @returns {Promise}
     */
    npmInstallTheme() {

        return this._npmInstallTheme(this.projectSlug)

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
