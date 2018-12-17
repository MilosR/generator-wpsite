<p align="center">
  <img src="https://github.com/MilosR/generator-wpsite/raw/master/logo.png" width="240" title="hover text">
</p>

---

Generator is in beta  

This generator creates complete environment for custom WordPress website/theme development.
It includes:

* Automatic WordPress download & install
  * Downloads newest version of WordPress
  * Creates MySQL database
  * Install WordPress
* Theme directories & files scaffold, remove excess directories
* Setup environment to use (Laravel Mix, Webpack):
  * SCSS > CSS
  * ES6
  * BrowserSync
  * .vue files
* Install npm packages:
  * jQuery
  * Vue.JS
  * Bootstrap
  * FontAwesome free
  * Owl Carousel
* Install WP Plugins:
  * Piklist

## Dependencies

 * LAMP Environment (for now only Windows is supported)
 * Node JS
 * In order to use this generator you must have MySQL & PHP binaries in your PATH.


## Installation

First, install [Yeoman](http://yeoman.io) and generator-wpsite using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo
npm install -g generator-wpsite
```

To setup new project create empty directory and run following command

```bash
yo wpsite
```

On proccess complete you need to add VirtualHost in your Apache configuration (domain in /etc/hosts also), if you are using Laragon then this process should be done automatically. Your website should be available on previously entered URL.

## Usage 

### SCSS, ES6, Live Reload (Laravel Mix)
 
To use SCSS, ES6, BrowserSync just use `npm run watch` inside theme folder  

*\* Note: Browsersync only works if WPSITE_DEV mode enabled*


### Working on frontend (HTML, CSS/SCSS, JS only)

If you are on beggining of your project and you don't want to use WordPress and PHP, you want only to work on HTML, SCSS-CSS
then you can use dev-\*.php files. Every dev-\*.php file created in theme directory will be called when you visit `http://yoursite.domain/dev/*` URL.  
 
Example: if you create `dev-homepage.php`, when you visit `http://yoursite.domain/dev/homepage` you will be served with `dev-homepage.php` template  
 
*\* Note: This only works if WPSITE_DEV mode enabled*


## License

This generator is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT).






