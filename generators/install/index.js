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
                if (files.filter((fileName) => {
                        return fileName == ".wpsite"
                    }).length == 0) {
                    this.env.error('This project is not generated using wpsite generator')
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
     * Chk dir
     * @returns {Promise}
     */
    readWpsiteFile() {

        let wpsite = JSON.parse(fs.readFileSync(".wpsite"));

        this.projectSlug = wpsite.projectSlug
        this.projectName = wpsite.projectName
        this.themeName = wpsite.themeName

    }


    /**
     * Prompt
     * @returns {Promise|*|Promise.<TResult>}
     */
    promptProjectDetails() {


        return this.prompt([{
            type: "input",
            name: "websiteUrl",
            message: "Enter website URL",
            default: "http://" + this.projectSlug + ".wpsite",
            required: true,
        },{
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

        return this._activateTheme(this.projectSlug)

    }

    /**
     * Install plugins
     * @returns {Promise}
     */
    installPlugins() {

        return this._installPlugins(["piklist"])

    }

    /**
     * Downloads WP Cli
     * @returns {Promise}
     */
    removeWPCLI() {

        return this._removeWPCLI();

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
